import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { useAuth } from '@/hooks/useAuth'

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setNewPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setSubmitError(null)
    setSuccess(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

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
      setSubmitError(result.error)
      return
    }
    setSuccess(true)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cambiar contraseña">
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-700">Tu contraseña se actualizó correctamente.</p>
          <div className="flex justify-end">
            <Button type="button" onClick={handleClose}>
              Listo
            </Button>
          </div>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
