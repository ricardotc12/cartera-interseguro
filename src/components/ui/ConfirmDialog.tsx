import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<{ error: string | null } | void>
  onClose: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Eliminar', onConfirm, onClose }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    const result = await onConfirm()
    setSubmitting(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{description}</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Eliminando…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
