import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, recoveryPending } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Cargando…</div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Hay una sesión (la que deja el enlace de "olvidé mi contraseña"), pero todavía no se
  // guardó la contraseña nueva: no se deja entrar al resto de la app hasta completarlo.
  if (recoveryPending) return <Navigate to="/restablecer-password" replace />

  return <AppShell>{children}</AppShell>
}
