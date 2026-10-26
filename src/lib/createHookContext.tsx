import { createContext, useContext, type ReactNode } from 'react'

/**
 * Envuelve un hook de datos (useAffiliates, usePayments, etc.) en un Context para que se
 * ejecute una sola vez por sesión, en vez de una vez por cada montaje de página. Antes, cada
 * hook vivía dentro del componente de la página que lo usaba — al navegar a otra sección y
 * volver, React desmontaba y volvía a montar esa página, así que el hook perdía su estado y
 * volvía a pedir todo a Supabase desde cero (de ahí la pantalla de carga repitiéndose todo el
 * rato). Con esto, el Provider se monta una sola vez por encima de las rutas (ver
 * DataProviders.tsx) y la navegación entre páginas reutiliza los mismos datos ya cargados.
 *
 * El hook en sí (su lógica de carga, mutaciones, etc.) no cambia en absoluto — solo se mueve
 * de "una instancia por página" a "una instancia compartida".
 */
export function createHookContext<T>(useHookImpl: () => T, hookName: string) {
  const Context = createContext<T | undefined>(undefined)

  function Provider({ children }: { children: ReactNode }) {
    const value = useHookImpl()
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useSharedHook(): T {
    const ctx = useContext(Context)
    if (ctx === undefined) throw new Error(`${hookName} debe usarse dentro de <DataProviders>`)
    return ctx
  }

  return [Provider, useSharedHook] as const
}
