import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { isValidDni } from '@/lib/validators'
import { today } from '@/lib/date'
import type { Contact } from '@/types/domain'
import type { ContactInput } from '@/hooks/useContacts'

/**
 * Sugerencias iniciales de etapa de seguimiento — no son un valor fijo: el campo es texto
 * libre (datalist), así que la asesora puede escribir cualquier otra etapa que necesite y
 * queda disponible como sugerencia la próxima vez, sin depender de una migración.
 */
export const SUGGESTED_STATUSES = [
  'Contactado',
  'Cotización enviada',
  'Interesado - en evaluación',
  'No contesta',
  'No quiso la póliza',
  'Pendiente de seguimiento',
  'Convertido a afiliado',
]

interface ContactFormModalProps {
  open: boolean
  onClose: () => void
  contact?: Contact
  statusSuggestions: string[]
  onSubmit: (input: ContactInput) => Promise<{ error: string | null }>
}

export function ContactFormModal({ open, onClose, contact, statusSuggestions, onSubmit }: ContactFormModalProps) {
  const isEdit = !!contact

  const [fullName, setFullName] = useState(contact?.fullName ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [dni, setDni] = useState(contact?.dni ?? '')
  const [status, setStatus] = useState(contact?.status ?? SUGGESTED_STATUSES[0]!)
  const [contactDate, setContactDate] = useState(contact?.contactDate ?? today())
  const [notes, setNotes] = useState(contact?.notes ?? '')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Ingresa el nombre.'
    if (dni && !isValidDni(dni)) errors.dni = 'El DNI debe tener exactamente 8 dígitos.'
    if (!status.trim()) errors.status = 'Ingresa o elige un estado.'
    if (!contactDate) errors.contactDate = 'Ingresa la fecha de contacto.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      dni: dni.trim() || null,
      status: status.trim(),
      contactDate,
      notes: notes.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  }

  const statusOptions = Array.from(new Set([...SUGGESTED_STATUSES, ...statusSuggestions]))

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar contacto' : 'Nuevo contacto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nombre" htmlFor="fullName" error={fieldErrors.fullName}>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClass(!!fieldErrors.fullName)}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Celular" htmlFor="phone" hint="Opcional">
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass()} />
          </FormField>
          <FormField label="DNI" htmlFor="dni" error={fieldErrors.dni} hint="Opcional">
            <input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              maxLength={8}
              className={fieldClass(!!fieldErrors.dni)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Estado del seguimiento" htmlFor="status" error={fieldErrors.status} hint="Elige uno o escribe el tuyo">
            <input
              id="status"
              list="contact-status-options"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={fieldClass(!!fieldErrors.status)}
            />
            <datalist id="contact-status-options">
              {statusOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FormField>
          <FormField label="Fecha de contacto" htmlFor="contactDate" error={fieldErrors.contactDate}>
            <input
              id="contactDate"
              type="date"
              value={contactDate}
              onChange={(e) => setContactDate(e.target.value)}
              className={fieldClass(!!fieldErrors.contactDate)}
            />
          </FormField>
        </div>

        <FormField label="Observaciones" htmlFor="notes" hint="Opcional">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </FormField>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar contacto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
