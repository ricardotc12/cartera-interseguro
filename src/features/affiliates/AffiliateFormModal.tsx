import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { isValidDni, isValidEmail, isValidAmount } from '@/lib/validators'
import { formatUsdApprox } from '@/lib/format'
import { today } from '@/lib/date'
import { useUsdRate } from '@/hooks/useUsdRate'
import type { AffiliateInput, AffiliateWithPolicies, PolicyInput } from '@/hooks/useAffiliates'
import type { AffiliateStatus } from '@/types/domain'

const STATUS_OPTIONS: { value: AffiliateStatus; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'cancelado', label: 'Cancelado' },
]

interface AffiliateFormModalProps {
  open: boolean
  onClose: () => void
  /** Si se pasa un afiliado, el formulario edita solo sus datos (la póliza se gestiona aparte). */
  affiliate?: AffiliateWithPolicies
  onSubmitCreate?: (affiliate: AffiliateInput, policy: PolicyInput) => Promise<{ error: string | null }>
  onSubmitEdit?: (patch: Partial<AffiliateInput>) => Promise<{ error: string | null }>
}

export function AffiliateFormModal({ open, onClose, affiliate, onSubmitCreate, onSubmitEdit }: AffiliateFormModalProps) {
  const isEdit = !!affiliate
  const usdRate = useUsdRate()

  const [dni, setDni] = useState(affiliate?.dni ?? '')
  const [firstName, setFirstName] = useState(affiliate?.firstName ?? '')
  const [lastName, setLastName] = useState(affiliate?.lastName ?? '')
  const [email, setEmail] = useState(affiliate?.email ?? '')
  const [phone, setPhone] = useState(affiliate?.phone ?? '')
  const [affiliationDate, setAffiliationDate] = useState(affiliate?.affiliationDate ?? today())
  const [status, setStatus] = useState<AffiliateStatus>(affiliate?.status ?? 'activo')
  const [observations, setObservations] = useState(affiliate?.observations ?? '')

  const [policyNumber, setPolicyNumber] = useState('')
  const [affiliationAmount, setAffiliationAmount] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!isValidDni(dni)) errors.dni = 'El DNI debe tener exactamente 8 dígitos.'
    if (!firstName.trim()) errors.firstName = 'Ingresa los nombres.'
    if (!lastName.trim()) errors.lastName = 'Ingresa los apellidos.'
    if (!isValidEmail(email)) errors.email = 'Ingresa un correo válido.'
    if (!affiliationDate) errors.affiliationDate = 'Ingresa la fecha de afiliación.'

    if (!isEdit) {
      if (!policyNumber.trim()) errors.policyNumber = 'Ingresa el número de póliza.'
      const amount = Number(affiliationAmount)
      if (!affiliationAmount || !isValidAmount(amount)) errors.affiliationAmount = 'Ingresa un monto válido (0 o mayor).'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const affiliateInput: AffiliateInput = {
      dni,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      affiliationDate,
      status,
      observations: observations.trim() || null,
    }

    const result = isEdit
      ? await onSubmitEdit?.(affiliateInput)
      : await onSubmitCreate?.(affiliateInput, {
          policyNumber: policyNumber.trim(),
          affiliationAmount: Number(affiliationAmount),
          startDate: affiliationDate,
          status,
        })

    setSubmitting(false)
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar afiliado' : 'Nuevo afiliado'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="DNI" htmlFor="dni" error={fieldErrors.dni}>
            <input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
              inputMode="numeric"
              maxLength={8}
              className={fieldClass(!!fieldErrors.dni)}
            />
          </FormField>
          <FormField label="Estado" htmlFor="status">
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AffiliateStatus)}
              className={fieldClass()}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nombres" htmlFor="firstName" error={fieldErrors.firstName}>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={fieldClass(!!fieldErrors.firstName)}
            />
          </FormField>
          <FormField label="Apellidos" htmlFor="lastName" error={fieldErrors.lastName}>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={fieldClass(!!fieldErrors.lastName)}
            />
          </FormField>
          <FormField label="Correo" htmlFor="email" error={fieldErrors.email}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass(!!fieldErrors.email)}
            />
          </FormField>
          <FormField label="Celular" htmlFor="phone">
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass()} />
          </FormField>
          <FormField label="Fecha de afiliación" htmlFor="affiliationDate" error={fieldErrors.affiliationDate}>
            <input
              id="affiliationDate"
              type="date"
              value={affiliationDate}
              onChange={(e) => setAffiliationDate(e.target.value)}
              className={fieldClass(!!fieldErrors.affiliationDate)}
            />
          </FormField>
        </div>

        <FormField label="Observaciones" htmlFor="observations">
          <textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </FormField>

        {!isEdit && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-3 text-sm font-medium text-slate-700">Póliza inicial</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                hint={
                  <>
                    {Number(affiliationAmount) > 0 && <>{formatUsdApprox(Number(affiliationAmount), usdRate)} · </>}
                    La Emisión Vida se calcula automáticamente con el multiplicador del período vigente.
                  </>
                }
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
            </div>
          </div>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear afiliado'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
