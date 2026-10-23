import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { isValidDni } from '@/lib/validators'
import { today } from '@/lib/date'
import type { Contact } from '@/types/domain'
import type { ContactInput } from '@/hooks/useContacts'

/**
 * Sugerencias iniciales de etapa de seguimiento — no son un valor fijo: la asesora puede
 * agregar cualquier otra etapa que necesite desde el propio desplegable ("+ Agregar nuevo
 * estado…") y queda disponible para elegir la próxima vez, sin depender de una migración.
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

const ADD_NEW_STATUS_VALUE = '__add_new__'

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
  const [status, setStatus] = useState(contact?.status ?? '')
  const [addingNewStatus, setAddingNewStatus] = useState(false)
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

  // Incluye siempre el estado actual del contacto, aunque ya no esté entre las sugerencias
  // (ej. si fue el único registro con esa etapa y luego se borró), para no perderlo del
  // desplegable al editar.
  const statusOptions = Array.from(new Set([...SUGGESTED_STATUSES, ...statusSuggestions, ...(contact ? [contact.status] : [])]))

  function handleStatusChange(value: string) {
    if (value === ADD_NEW_STATUS_VALUE) {
      setAddingNewStatus(true)
      setStatus('')
      return
    }
    setAddingNewStatus(false)
    setStatus(value)
  }

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
          <FormField label="Estado del seguimiento" htmlFor="status" error={fieldErrors.status}>
            {addingNewStatus ? (
              <div className="flex gap-2">
                <input
                  id="status"
                  autoFocus
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Escribe el nuevo estado"
                  className={fieldClass(!!fieldErrors.status)}
                />
                <button
                  type="button"
                  onClick={() => handleStatusChange(statusOptions[0] ?? '')}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <select id="status" value={status} onChange={(e) => handleStatusChange(e.target.value)} className={fieldClass(!!fieldErrors.status)}>
                <option value="" disabled>
                  Selecciona un estado
                </option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={ADD_NEW_STATUS_VALUE}>+ Agregar nuevo estado…</option>
              </select>
            )}
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
