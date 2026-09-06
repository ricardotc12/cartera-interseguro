# Cartera Interseguro

Sistema de gestión de afiliados, cobranza, metas e incentivos (Interseguro Perú). React + TypeScript + Vite + Tailwind + Supabase. Ver el plan completo en `docs/` (o el archivo de plan de Claude Code) para el detalle de arquitectura y fases.

## Requisitos

- Node.js 20.19+ o 22.12+ (usa `nvm` si tu versión actual es más antigua)
- Una cuenta gratuita en [supabase.com](https://supabase.com) con un proyecto creado

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
# Completa .env.local con la URL y la anon key de tu proyecto Supabase
# (Supabase Dashboard > Configuración del proyecto > API)
```

Aplica el esquema de base de datos: abre el **SQL Editor** de tu proyecto Supabase y ejecuta, **en orden**, cada archivo de `supabase/migrations/` (0001, luego 0002, luego 0003...). Cada vez que agregue una migración nueva, ejecuta solo la que te falte.

Crea tu usuario: en Supabase Dashboard > Authentication > Users > "Add user", crea tu correo/contraseña de acceso (o habilita el registro público si prefieres).

```bash
npm run dev       # servidor de desarrollo
npm run test      # tests de las funciones de dominio (Vitest)
npm run build     # build de producción (incluye chequeo de tipos)
```

## Estructura

- `src/domain/` — funciones puras de cálculo (Emisión Vida, incentivos, cobranza, ICV, períodos), con tests.
- `src/features/` — una carpeta por pantalla del menú.
- `src/components/` — UI compartida (`ui/`) y layout responsive (`layout/`).
- `supabase/migrations/` — esquema SQL versionado (tablas, RLS, auditoría).

## Despliegue

Pensado para desplegarse gratis en [Vercel](https://vercel.com): importar el repositorio, definir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno del proyecto, y desplegar (`npm run build` / carpeta `dist`).
