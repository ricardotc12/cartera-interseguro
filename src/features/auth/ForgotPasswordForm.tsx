import { useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: resetError } = await resetPasswordForEmail(email.trim())
    setSubmitting(false)
    if (resetError) {
      setError(resetError)
      return
    }
    setSent(true)
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a ingresar
      </button>

      {sent ? (
        <p className="text-sm text-emerald-700">
          Si el correo <span className="font-medium">{email}</span> tiene una cuenta registrada, te enviamos un enlace para restablecer tu
          contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Recuperar contraseña</h2>
            <p className="mt-1 text-xs text-slate-500">Ingresa tu correo y te enviaremos un enlace para elegir una contraseña nueva.</p>
          </div>
          <div>
            <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </Button>
        </form>
      )}
    </div>
  )
}
