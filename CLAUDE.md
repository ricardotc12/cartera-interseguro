# Cartera Interseguro — guía para Claude Code

Sistema de gestión de cartera para un asesor de vida de Interseguro Perú (afiliados, pólizas, cobranza, metas, incentivos, ICV, cotizador). React + TypeScript (strict) + Vite + Tailwind + Supabase (Postgres + Auth + RLS), desplegado en Vercel. Pensado para venderse a otros agentes de vida como herramienta de seguimiento personal.

## Flujo de trabajo — SIEMPRE así

1. **Nunca inventar datos ni reglas de negocio.** Montos, fórmulas, tramos de incentivo, fechas de corte, etc. los da el usuario — si falta un dato real, se pregunta o se deja que el usuario lo complete manualmente (nunca se rellena con un valor inventado).
2. **Toda migración de Supabase nueva se muestra de forma prominente** en el resumen final de la respuesta, con el SQL completo en su propio bloque — no basta con mencionarla en el mensaje del commit. El usuario la copia y la corre él mismo en el SQL Editor de Supabase (no tengo acceso directo a su proyecto).
3. **Verificación obligatoria antes de dar algo por terminado**, en este orden:
   ```bash
   npx tsc --noEmit                              # proyecto principal
   npx tsc --noEmit -p api/tsconfig.json          # funciones serverless (si se tocaron)
   npm run test                                   # Vitest — dominio puro
   npm run lint                                   # ESLint
   npm run build                                  # build de producción
   ```
   Si algo tocó UI, verificar en el navegador (ver sección siguiente) antes de dar por bueno el cambio.
4. **Despliegue a producción: SIEMPRE que se termina un cambio**, se hace commit y `git push origin main` sin que el usuario tenga que pedirlo cada vez — es el flujo que hemos seguido toda la sesión. `main` es la rama de producción en Vercel (deploy automático al hacer push). Commits con `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
5. **Nunca tocar código que ya funciona** fuera del alcance pedido ("no vayas a malograr lo que ya funciona" — instrucción explícita del usuario).
6. **Verificar UI en navegador** con un harness temporal cuando haga falta (p. ej. `src/features/dashboard/DashboardPage.tsx` necesita sesión real, así que para probar un componente aislado se agrega una ruta temporal tipo `/__preview/algo` en `src/App.tsx` con datos simulados, se verifica, y se **elimina todo** —la ruta y el archivo del harness— antes de hacer commit). Nunca enviar formularios reales (signup, pagos, etc.) contra el Supabase de producción del usuario; para eso probar solo la validación/UI, no el submit real.

## Arquitectura clave

- **`src/domain/`** — funciones puras de cálculo (Emisión Vida, tramos de incentivo, factor de cobranza, ICV, períodos, fechas de pago), cada una con sus tests en Vitest. Es la fuente de verdad de las reglas de negocio.
- **`src/features/`** — una carpeta por pantalla del menú (afiliados, contacts, collection, dashboard, goals, icv, incentives, quotes, reports, settings, simulator, auth).
- **`src/hooks/`** — un hook por entidad (`useAffiliates`, `usePayments`, `useContacts`, `usePeriodsAdmin`, `useIcvRecords`, `useProfile`, etc.), cada uno con su CRUD contra Supabase.
- **Datos compartidos entre páginas (`src/providers/DataProviders.tsx` + `src/lib/createHookContext.tsx`)**: los 6 hooks de arriba se montan **una sola vez** por encima de `<Routes>` en `App.tsx`, no dentro de cada página — así navegar entre secciones reutiliza los datos ya cargados en vez de volver a pedirlos a Supabase cada vez (antes de este cambio, cada navegación mostraba la pantalla de carga de nuevo). Al agregar un hook de datos nuevo que se use en más de una pantalla, seguir el mismo patrón: envolverlo con `createHookContext` y agregar su Provider a `DataProviders.tsx`.
- **`src/components/ui/Modal.tsx`** — modal compartido por toda la app. `size="sheet"` (por defecto, formularios largos) o `size="alert"` (avisos cortos, centrado). Ya resuelve: blur + bloqueo de scroll de fondo, `overscroll-behavior: none` a nivel de página (evita el rebote elástico de iOS), y se ancla al `visualViewport` real (no al viewport de layout) para que no "flote"/se mueva cuando aparece el teclado en iOS. Siempre montar los modales condicionalmente (`{open && <Modal/>}`), nunca con `open` como único control, para evitar bugs de estado inicial obsoleto.
- **`api/*.ts`** — funciones serverless de Vercel (hoy: `send-daily-alerts.ts`, cron diario). **No importan nada de `src/`**: el bundler de funciones de Vercel no resuelve el alias `@/` que sí resuelve Vite para el frontend, así que cualquier lógica que necesiten (fechas, reglas) se duplica ahí mismo con un comentario explicando por qué. `api/tsconfig.json` existe solo para poder tipar localmente (`npx tsc --noEmit -p api/tsconfig.json`); Vercel compila `/api` por su cuenta y no lo necesita.
- **PWA (`src/main.tsx` + `vite-plugin-pwa`)**: revisa cada 30 minutos si hay una versión nueva desplegada y, si la hay, recarga la página sola una vez. (Antes era cada 1 minuto — se espació porque interrumpía al usuario a media tarea cuando yo desplegaba varias veces seguidas.)

## Infraestructura externa

- **Supabase**: Postgres + Auth + RLS. Todo scoped por `created_by = auth.uid()`, con políticas que además verifican que los IDs referenciados (afiliado de una póliza, póliza de un pago, período de una regla) pertenezcan al mismo usuario (migración `0014_cross_reference_rls.sql`). Registro de cuenta propio (correo + nombre + clave) con verificación de correo vía Supabase Auth (`src/features/auth/SignUpForm.tsx`); el nombre se guarda solo en `profiles` vía un trigger de base de datos (`handle_new_user`).
- **Vercel**: hosting del frontend (deploy automático al hacer push a `main`) + la función de cron (`api/send-daily-alerts.ts`, corre todos los días pero solo manda correo si hay algo puntual ese día — ver siguiente punto). Variables de entorno que necesita en Vercel (Settings → Environments → Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (ya cargadas), `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → pestaña "Legacy anon, service_role API keys"), `RESEND_API_KEY`, `CRON_SECRET` (inventado).
- **Resend**: envío de los correos de alerta (remitente de prueba `onboarding@resend.dev`, sin dominio propio verificado todavía).

### Lógica de alertas por correo (puntual, no diaria)

El cron corre todos los días pero **no manda correo todos los días** — solo cuando algo cae justo en uno de estos momentos (si no hay nada, no llega nada):
- **Cobranza**: un día antes de vencer, el mismo día que vence, y 7 días después (cobranza ya cerrada, "ponte al día").
- **Cotización por vencer** (campo `quote_expiry_date` en `contacts`, visible solo si el estado es "Cotización enviada"): un solo correo, 2 días antes.
- **Recontactar** (`next_contact_date` en `contacts`): un día antes y el mismo día acordado.

Las alertas dentro del propio Dashboard (modales al entrar, campanita de la barra superior) siguen siendo "mientras esté pendiente" (no son push, el usuario las ve cuando abre la app, así que no hay problema de spam).

## Reglas de negocio ya implementadas (resumen)

- **Emisión Vida** = monto real de afiliación × multiplicador del período vigente (hoy ×10) — usado para medir metas e incentivos de Interseguro. Es DISTINTO del "monto real de pólizas" (suma sin multiplicar, lo que de verdad pagan los afiliados — tarjeta/modal propios en el Dashboard).
- **Tramos de incentivo, factor de cobranza, factor ICV**: configurables por período en `/configuracion/periodos`, con tablas de reglas (`incentive_rules`, `collection_factor_rules`, `icv_factor_rules`).
- **Estados de pago** (`PaymentStatus`): `pagado`, `no_pagado`, `pendiente_confirmar`, `no_corresponde`. Vencimiento por defecto el día 20 del mes si no se especifica otro.
- **Estados de afiliado/póliza** (`AffiliateStatus`): `activo`, `pendiente`, `inactivo`, `cancelado`.
- **Estados de período** (`PeriodStatus`): `draft`, `active`, `closed` (cerrado = reglas inmutables).
- **Seguimiento de contactos** (prospección, separado de afiliados): estado libre con sugerencias (`Contactado`, `Cotización enviada`, `No contesta`, `No quiso la póliza`, `Pendiente de seguimiento`, `Convertido a afiliado` — **ya no existe** "Interesado - en evaluación", se fusionó con "Cotización enviada" vía migración `0016`), fecha de recontacto, fecha de vencimiento de cotización, vista de detalle con el ícono de ojo (igual que Afiliados).

## Pendientes / ideas discutidas pero no construidas

- **Rol supervisor**: un supervisor viendo el avance (meta, cobranza, ICV) de sus agentes a cargo, sin ver el detalle de sus afiliados — evaluado como viable pero es un proyecto aparte (roles, relación supervisor-agente, vista agregada vía función/vista de base de datos, nunca acceso directo a las tablas de otro usuario). No empezar sin que haya un caso real esperando por esto.
- Dominio propio verificado en Resend (hoy usa el remitente de prueba `onboarding@resend.dev`).

## Comandos útiles

```bash
npm run dev     # servidor de desarrollo (usar siempre el preview tool, nunca Bash, para levantarlo)
npm run test    # tests de dominio (Vitest)
npm run lint    # ESLint
npm run build   # build de producción (incluye tsc -b)
```

Migraciones en `supabase/migrations/`, numeradas y aplicadas en orden (última: `0016`). El usuario las corre manualmente en el SQL Editor de Supabase — nunca asumir que ya están aplicadas sin que él lo confirme.
