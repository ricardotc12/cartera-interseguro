import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { today } from '@/lib/date'
import { calculateDaysActive } from '@/domain'
import type { PolicyInput } from '@/hooks/useAffiliates'
import type { AffiliateStatus, Modalidad, Policy } from '@/types/domain'
import { CoverageBreakdown, createInitialCoverageRows, coverageRowsToInputs, validateCoverageRows } from './CoverageBreakdown'

const STATUS_OPTIONS: { value: AffiliateStatus; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'cancelado', label: 'Cancelado' },
]

interface PolicyFormModalProps {
  open: boolean
  onClose: () => void
  policy?: Policy
  onSubmit: (input: PolicyInput) => Promise<{ error: string | null }>
}

export function PolicyFormModal({ open, onClose, policy, onSubmit }: PolicyFormModalProps) {
  const isEdit = !!policy

  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '')
  const [startDate, setStartDate] = useState(policy?.startDate ?? today())
  const [status, setStatus] = useState<AffiliateStatus>(policy?.status ?? 'activo')
  const [cancellationDate, setCancellationDate] = useState(policy?.cancellationDate ?? '')
  const [modalidad, setModalidad] = useState<Modalidad>(policy?.modalidad ?? 'mensual')
  const [coverageRows, setCoverageRows] = useState(() => createInitialCoverageRows(policy?.coverages))

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const daysActive = calculateDaysActive(startDate, cancellationDate || null)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!policyNumber.trim()) errors.policyNumber = 'Ingresa el número de póliza.'
    if (!startDate) errors.startDate = 'Ingresa la fecha de emisión.'
    const coverageError = validateCoverageRows(coverageRows)
    if (coverageError) errors.coverages = coverageError
    if (status === 'cancelado' && !cancellationDate) errors.cancellationDate = 'Ingresa la fecha de cancelación.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit({
      policyNumber: policyNumber.trim(),
      modalidad,
      startDate,
      cancellationDate: status === 'cancelado' ? cancellationDate : null,
      status,
      coverages: coverageRowsToInputs(coverageRows),
    })
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar póliza' : 'Nueva póliza'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Número de póliza" htmlFor="policyNumber" error={fieldErrors.policyNumber}>
          <input
            id="policyNumber"
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            className={fieldClass(!!fieldErrors.policyNumber)}
          />
        </FormField>

        <CoverageBreakdown
          rows={coverageRows}
          onChange={setCoverageRows}
          modalidad={modalidad}
          onModalidadChange={setModalidad}
          error={fieldErrors.coverages}
        />

        <FormField label="Fecha de Emisión" htmlFor="startDate" error={fieldErrors.startDate}>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={fieldClass(!!fieldErrors.startDate)}
          />
        </FormField>
        <FormField label="Estado" htmlFor="status">
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as AffiliateStatus)} className={fieldClass()}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {status === 'cancelado' && (
          <FormField
            label="Fecha de cancelación"
            htmlFor="cancellationDate"
            error={fieldErrors.cancellationDate}
            hint={daysActive != null ? `Estuvo vigente ${daysActive} días.` : undefined}
          >
            <input
              id="cancellationDate"
              type="date"
              value={cancellationDate}
              min={startDate}
              onChange={(e) => setCancellationDate(e.target.value)}
              className={fieldClass(!!fieldErrors.cancellationDate)}
            />
          </FormField>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar póliza'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
