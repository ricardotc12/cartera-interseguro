import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { isValidAmount } from '@/lib/validators'
import type { PaymentUpdateInput } from '@/hooks/usePayments'
import type { PaymentWithContext } from '@/hooks/usePayments'
import type { PaymentStatus } from '@/types/domain'

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'pagado', label: 'Pagado' },
  { value: 'no_pagado', label: 'No pagado' },
  { value: 'pendiente_confirmar', label: 'Pendiente de confirmar' },
  { value: 'no_corresponde', label: 'No corresponde' },
]

interface PaymentFormModalProps {
  open: boolean
  onClose: () => void
  payment: PaymentWithContext
  /** Valores iniciales sugeridos (ej. al usar "Registrar pago" se sugiere marcar como pagado). */
  initial?: Partial<PaymentUpdateInput>
  onSubmit: (input: PaymentUpdateInput) => Promise<{ error: string | null }>
}

export function PaymentFormModal({ open, onClose, payment, initial, onSubmit }: PaymentFormModalProps) {
  const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? payment.status)
  const [paidAmount, setPaidAmount] = useState(
    initial?.paidAmount != null ? String(initial.paidAmount) : payment.paidAmount != null ? String(payment.paidAmount) : '',
  )
  const [paymentDate, setPaymentDate] = useState(initial?.paymentDate ?? payment.paymentDate ?? '')
  const [expectedAmount, setExpectedAmount] = useState(String(initial?.expectedAmount ?? payment.expectedAmount))
  const [dueDate, setDueDate] = useState(payment.dueDate ?? '')
  const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod ?? '')
  const [operationNumber, setOperationNumber] = useState(payment.operationNumber ?? '')
  const [observation, setObservation] = useState(payment.observation ?? '')
  const [isRescheduled, setIsRescheduled] = useState(payment.isRescheduled)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!isValidAmount(Number(expectedAmount))) errors.expectedAmount = 'Ingresa un monto válido.'
    if (paidAmount && !isValidAmount(Number(paidAmount))) errors.paidAmount = 'Ingresa un monto válido.'
    if (status === 'pagado' && !paidAmount) errors.paidAmount = 'Ingresa el monto pagado.'
    if (status === 'pagado' && !paymentDate) errors.paymentDate = 'Ingresa la fecha de pago.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit({
      status,
      paidAmount: paidAmount ? Number(paidAmount) : null,
      paymentDate: paymentDate || null,
      expectedAmount: Number(expectedAmount),
      isRescheduled,
      paymentMethod: paymentMethod.trim() || null,
      operationNumber: operationNumber.trim() || null,
      dueDate: dueDate || null,
      observation: observation.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${payment.affiliate.firstName} ${payment.affiliate.lastName} · ${formatMonthYear(payment.yearMonth)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">
          Póliza {payment.policy.policyNumber} · Monto esperado {formatCurrency(payment.expectedAmount)}
        </p>

        <FormField label="Estado" htmlFor="status">
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} className={fieldClass()}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Monto pagado (S/)" htmlFor="paidAmount" error={fieldErrors.paidAmount}>
            <input
              id="paidAmount"
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className={fieldClass(!!fieldErrors.paidAmount)}
            />
          </FormField>
          <FormField label="Fecha de pago" htmlFor="paymentDate" error={fieldErrors.paymentDate}>
            <input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={fieldClass(!!fieldErrors.paymentDate)}
            />
          </FormField>
          <FormField label="Monto esperado (S/)" htmlFor="expectedAmount" error={fieldErrors.expectedAmount}>
            <input
              id="expectedAmount"
              type="number"
              min="0"
              step="0.01"
              value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)}
              className={fieldClass(!!fieldErrors.expectedAmount)}
            />
          </FormField>
          <FormField label="Fecha de vencimiento" htmlFor="dueDate" hint="Opcional">
            <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass()} />
          </FormField>
          <FormField label="Medio de pago" htmlFor="paymentMethod" hint="Opcional">
            <input id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={fieldClass()} />
          </FormField>
          <FormField label="N° de operación" htmlFor="operationNumber" hint="Opcional">
            <input
              id="operationNumber"
              value={operationNumber}
              onChange={(e) => setOperationNumber(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
        </div>

        <FormField label="Observación" htmlFor="observation">
          <textarea
            id="observation"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </FormField>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={isRescheduled}
            onChange={(e) => setIsRescheduled(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Prima reprogramada (no se contabiliza en el Ratio de Cobranza)</span>
        </label>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
