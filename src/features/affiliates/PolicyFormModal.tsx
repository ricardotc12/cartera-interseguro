import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { isValidAmount } from '@/lib/validators'
import { formatUsdApprox } from '@/lib/format'
import { today } from '@/lib/date'
import { useUsdRate } from '@/hooks/useUsdRate'
import type { PolicyInput } from '@/hooks/useAffiliates'
import type { AffiliateStatus, Policy } from '@/types/domain'

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
  const usdRate = useUsdRate()

  const [policyNumber, setPolicyNumber] = useState(policy?.policyNumber ?? '')
  const [affiliationAmount, setAffiliationAmount] = useState(policy ? String(policy.affiliationAmount) : '')
  const [startDate, setStartDate] = useState(policy?.startDate ?? today())
  const [status, setStatus] = useState<AffiliateStatus>(policy?.status ?? 'activo')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!policyNumber.trim()) errors.policyNumber = 'Ingresa el número de póliza.'
    const amount = Number(affiliationAmount)
    if (!affiliationAmount || !isValidAmount(amount)) errors.affiliationAmount = 'Ingresa un monto válido (0 o mayor).'
    if (!startDate) errors.startDate = 'Ingresa la fecha de inicio.'
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
      affiliationAmount: Number(affiliationAmount),
      startDate,
      status,
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
        <FormField
          label="Monto de afiliación (S/)"
          htmlFor="affiliationAmount"
          error={fieldErrors.affiliationAmount}
          hint={Number(affiliationAmount) > 0 ? formatUsdApprox(Number(affiliationAmount), usdRate) : undefined}
        >
          <input
            id="affiliationAmount"
            type="number"
            min="0"
            step="0.01"
            value={affiliationAmount}
            onChange={(e) => setAffiliationAmount(e.target.value)}
            className={fieldClass(!!fieldErrors.affiliationAmount)}
          />
        </FormField>
        <FormField label="Fecha de inicio" htmlFor="startDate" error={fieldErrors.startDate}>
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
