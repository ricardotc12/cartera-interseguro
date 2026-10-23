import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { BrandLogo } from '@/components/layout/BrandLogo'

/**
 * Página a la que lleva el enlace del correo de "recuperar contraseña" (sección "olvidé mi
 * contraseña"). Supabase ya deja una sesión temporal de recuperación al abrir el enlace — solo
 * falta pedir la contraseña nueva y guardarla con updatePassword, igual que en Cambiar contraseña.
 */
export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (newPassword.length < 6) errors.newPassword = 'Debe tener al menos 6 caracteres.'
    if (confirmPassword !== newPassword) errors.confirmPassword = 'Las contraseñas no coinciden.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const result = await updatePassword(newPassword)
    setSubmitting(false)

    if (result.error) {
      setSubmitError('El enlace venció o ya se usó. Vuelve a la pantalla de ingreso y solicita uno nuevo con "¿Olvidaste tu contraseña?".')
      return
    }
    setSuccess(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandLogo variant="compact" className="h-14 w-14 shadow-card" />
          <h1 className="text-xl font-semibold text-slate-900">Cartera Interseguro</h1>
          <p className="text-sm text-slate-500">Elige tu nueva contraseña</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          {success ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-700">Tu contraseña se actualizó correctamente.</p>
              <Link
                to="/login"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Ir a ingresar
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Nueva contraseña" htmlFor="newPassword" error={fieldErrors.newPassword} hint="Mínimo 6 caracteres.">
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={fieldClass(!!fieldErrors.newPassword)}
                />
              </FormField>
              <FormField label="Confirmar contraseña" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={fieldClass(!!fieldErrors.confirmPassword)}
                />
              </FormField>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Guardando…' : 'Guardar nueva contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
