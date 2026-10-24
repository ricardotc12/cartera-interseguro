import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { isValidEmail } from '@/lib/validators'

export function SignUpForm({ onBack }: { onBack: () => void }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Ingresa tu nombre completo.'
    if (!email.trim() || !isValidEmail(email)) errors.email = 'Ingresa un correo válido.'
    if (password.length < 6) errors.password = 'Debe tener al menos 6 caracteres.'
    if (confirmPassword !== password) errors.confirmPassword = 'Las contraseñas no coinciden.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const { error } = await signUp(email.trim(), password, fullName.trim())
    setSubmitting(false)

    if (error) {
      setSubmitError(error)
      return
    }
    setSent(true)
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Volver a ingresar
      </button>

      {sent ? (
        <p className="text-sm text-emerald-700">
          Te enviamos un correo a <span className="font-medium">{email}</span> para confirmar tu cuenta. Revisa tu bandeja de entrada
          (y la carpeta de spam) y haz clic en el enlace para poder ingresar.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Crear cuenta</h2>
            <p className="mt-1 text-xs text-slate-500">Completa tus datos para empezar a usar el portal.</p>
          </div>

          <FormField label="Nombre completo" htmlFor="signup-fullName" error={fieldErrors.fullName}>
            <input
              id="signup-fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass(!!fieldErrors.fullName)}
            />
          </FormField>

          <FormField label="Correo" htmlFor="signup-email" error={fieldErrors.email}>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass(!!fieldErrors.email)}
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="signup-password" error={fieldErrors.password} hint="Mínimo 6 caracteres.">
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass(!!fieldErrors.password)}
            />
          </FormField>

          <FormField label="Confirmar contraseña" htmlFor="signup-confirmPassword" error={fieldErrors.confirmPassword}>
            <input
              id="signup-confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass(!!fieldErrors.confirmPassword)}
            />
          </FormField>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      )}
    </div>
  )
}
