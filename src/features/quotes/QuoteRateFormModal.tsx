import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { PROTECTION_TYPES } from '@/domain'
import type { QuoteRate } from '@/types/domain'
import type { QuoteRateInput } from '@/hooks/useQuoteRates'

interface QuoteRateFormModalProps {
  open: boolean
  onClose: () => void
  rate?: QuoteRate
  onSubmit: (input: QuoteRateInput) => Promise<{ error: string | null }>
}

/** '' en un campo numérico opcional significa "Por definir" (null) — nunca se envía un 0 inventado en su lugar. */
function toNullableNumber(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function QuoteRateFormModal({ open, onClose, rate, onSubmit }: QuoteRateFormModalProps) {
  const isEdit = !!rate

  const [ageMin, setAgeMin] = useState(rate ? String(rate.ageMin) : '')
  const [ageMax, setAgeMax] = useState(rate ? String(rate.ageMax) : '')
  const [product, setProduct] = useState(rate?.product ?? '')
  const [plan, setPlan] = useState(rate?.plan ?? '')
  const [protectionType, setProtectionType] = useState<QuoteRateInput['protectionType']>(rate?.protectionType ?? 'integral')
  const [coverageYears, setCoverageYears] = useState(rate ? String(rate.coverageYears) : '')
  const [primaMensual, setPrimaMensual] = useState(rate?.primaMensual != null ? String(rate.primaMensual) : '')
  const [primaAnual, setPrimaAnual] = useState(rate?.primaAnual != null ? String(rate.primaAnual) : '')
  const [montoAsegurado, setMontoAsegurado] = useState(rate?.montoAsegurado != null ? String(rate.montoAsegurado) : '')
  const [pctDevolucion, setPctDevolucion] = useState(rate?.pctDevolucion != null ? String(rate.pctDevolucion * 100) : '')
  const [totalDevolucion, setTotalDevolucion] = useState(rate?.totalDevolucion != null ? String(rate.totalDevolucion) : '')
  const [notes, setNotes] = useState(rate?.notes ?? '')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const errors: Record<string, string> = {}
    const min = Number(ageMin)
    const max = Number(ageMax)
    if (!ageMin || !Number.isFinite(min) || min < 18 || min > 60) errors.ageMin = 'Edad entre 18 y 60.'
    if (!ageMax || !Number.isFinite(max) || max < 18 || max > 60) errors.ageMax = 'Edad entre 18 y 60.'
    if (!errors.ageMin && !errors.ageMax && max < min) errors.ageMax = 'Debe ser mayor o igual que la edad mínima.'
    if (!product.trim()) errors.product = 'Ingresa el producto.'
    if (!plan.trim()) errors.plan = 'Ingresa el plan.'
    const years = Number(coverageYears)
    if (!coverageYears || !Number.isFinite(years) || years <= 0) errors.coverageYears = 'Ingresa un período válido en años.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    const pct = toNullableNumber(pctDevolucion)
    const result = await onSubmit({
      ageMin: Number(ageMin),
      ageMax: Number(ageMax),
      product: product.trim(),
      plan: plan.trim(),
      protectionType,
      coverageYears: Number(coverageYears),
      primaMensual: toNullableNumber(primaMensual),
      primaAnual: toNullableNumber(primaAnual),
      montoAsegurado: toNullableNumber(montoAsegurado),
      pctDevolucion: pct != null ? pct / 100 : null,
      totalDevolucion: toNullableNumber(totalDevolucion),
      notes: notes.trim() || null,
    })
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar tarifa' : 'Nueva tarifa'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-400">
          Deja un campo de monto en blanco si todavía no tienes ese valor real — se mostrará como "Por definir" en vez de inventar un número.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Edad desde" htmlFor="ageMin" error={fieldErrors.ageMin} hint="Usa el mismo valor en ambos para una edad exacta">
            <input
              id="ageMin"
              type="number"
              min={18}
              max={60}
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              className={fieldClass(!!fieldErrors.ageMin)}
            />
          </FormField>
          <FormField label="Edad hasta" htmlFor="ageMax" error={fieldErrors.ageMax}>
            <input
              id="ageMax"
              type="number"
              min={18}
              max={60}
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              className={fieldClass(!!fieldErrors.ageMax)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Producto" htmlFor="product" error={fieldErrors.product}>
            <input
              id="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Ej. Vida Free"
              className={fieldClass(!!fieldErrors.product)}
            />
          </FormField>
          <FormField label="Plan" htmlFor="plan" error={fieldErrors.plan}>
            <input
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Ej. Vida Free"
              className={fieldClass(!!fieldErrors.plan)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tipo de protección" htmlFor="protectionType">
            <select
              id="protectionType"
              value={protectionType}
              onChange={(e) => setProtectionType(e.target.value as QuoteRateInput['protectionType'])}
              className={fieldClass()}
            >
              {PROTECTION_TYPES.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Período de cobertura (años)" htmlFor="coverageYears" error={fieldErrors.coverageYears}>
            <input
              id="coverageYears"
              type="number"
              min={1}
              value={coverageYears}
              onChange={(e) => setCoverageYears(e.target.value)}
              className={fieldClass(!!fieldErrors.coverageYears)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prima mensual (S/)" htmlFor="primaMensual" hint="Opcional">
            <input
              id="primaMensual"
              type="number"
              min="0"
              step="0.01"
              value={primaMensual}
              onChange={(e) => setPrimaMensual(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
          <FormField label="Prima anual (S/)" htmlFor="primaAnual" hint="Opcional">
            <input
              id="primaAnual"
              type="number"
              min="0"
              step="0.01"
              value={primaAnual}
              onChange={(e) => setPrimaAnual(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
          <FormField label="Monto asegurado (S/)" htmlFor="montoAsegurado" hint="Opcional">
            <input
              id="montoAsegurado"
              type="number"
              min="0"
              step="0.01"
              value={montoAsegurado}
              onChange={(e) => setMontoAsegurado(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
          <FormField label="% Devolución" htmlFor="pctDevolucion" hint="Opcional. Ej. 100 para 100%">
            <input
              id="pctDevolucion"
              type="number"
              min="0"
              step="0.01"
              value={pctDevolucion}
              onChange={(e) => setPctDevolucion(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
          <FormField label="Total devolución (S/)" htmlFor="totalDevolucion" hint="Opcional">
            <input
              id="totalDevolucion"
              type="number"
              min="0"
              step="0.01"
              value={totalDevolucion}
              onChange={(e) => setTotalDevolucion(e.target.value)}
              className={fieldClass()}
            />
          </FormField>
        </div>

        <FormField label="Observaciones" htmlFor="notes">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </FormField>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar tarifa'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
