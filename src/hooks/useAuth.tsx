import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** true desde que se abre el enlace de "olvidé mi contraseña" hasta que se guarda la contraseña nueva: aunque ya exista una sesión válida, no debe dejar entrar al resto de la app todavía. */
  recoveryPending: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const RECOVERY_PENDING_KEY = 'auth_recovery_pending'

function readRecoveryPending(): boolean {
  return localStorage.getItem(RECOVERY_PENDING_KEY) === 'true'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryPending, setRecoveryPendingState] = useState(readRecoveryPending)

  function setRecoveryPending(value: boolean) {
    if (value) localStorage.setItem(RECOVERY_PENDING_KEY, 'true')
    else localStorage.removeItem(RECOVERY_PENDING_KEY)
    setRecoveryPendingState(value)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      // Supabase ya deja una sesión válida apenas se abre el enlace del correo, antes de que
      // se guarde la contraseña nueva — sin esta marca, ProtectedRoute dejaría entrar al resto
      // de la app con esa sesión temporal sin haber cambiado nada.
      if (event === 'PASSWORD_RECOVERY') setRecoveryPending(true)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setRecoveryPending(false)
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setRecoveryPending(false)
    return { error: error?.message ?? null }
  }

  /** Envía el correo de "restablecer contraseña" (sección "olvidé mi contraseña"); el enlace lleva a /restablecer-password. */
  async function resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        recoveryPending,
        signInWithPassword,
        signOut,
        updatePassword,
        resetPasswordForEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
