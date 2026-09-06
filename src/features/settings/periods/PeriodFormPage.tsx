import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { TierEditor, newTierRow, type TierRowState } from './TierEditor'
import type { PeriodInput, PeriodRulesPayload, PeriodWithRules } from '@/hooks/usePeriodsAdmin'
import type { CollectionFactorRule, IcvFactorRule, IncentiveRule } from '@/types/domain'

type RuleSource = 'keep' | 'copy' | 'new'

interface PeriodFormPageProps {
  mode: 'create' | 'edit' | 'view'
  /** Período anterior disponible para copiar/mantener reglas (solo en modo 'create'). */
  sourcePeriod?: PeriodWithRules
  /** Período que se está editando o viendo. */
  editingPeriod?: PeriodWithRules
  onSubmit: (period: PeriodInput, rules: PeriodRulesPayload) => Promise<{ error: string | null }>
  onCancel: () => void
}

function incentiveRulesToRows(rules: IncentiveRule[]): TierRowState[] {
  return rules.map((r) => ({ id: r.id, min: String(r.min), max: r.max == null ? '' : String(r.max), value: String(r.percentage * 100) }))
}

function factorRulesToRows(rules: (CollectionFactorRule | IcvFactorRule)[]): TierRowState[] {
  return rules.map((r) => ({ id: r.id, min: String(r.min), max: r.max == null ? '' : String(r.max), value: String(r.factor) }))
}

function rowsToIncentivePayload(rows: TierRowState[]) {
  return rows
    .filter((r) => r.min !== '' && r.value !== '')
    .map((r) => ({ min: Number(r.min), max: r.max === '' ? null : Number(r.max), percentage: Number(r.value) / 100 }))
}

function rowsToFactorPayload(rows: TierRowState[]) {
  return rows
    .filter((r) => r.min !== '' && r.value !== '')
    .map((r) => ({ min: Number(r.min), max: r.max === '' ? null : Number(r.max), factor: Number(r.value) }))
}

export function PeriodFormPage({ mode, sourcePeriod, editingPeriod, onSubmit, onCancel }: PeriodFormPageProps) {
  const base = editingPeriod ?? sourcePeriod
  const [ruleSource, setRuleSource] = useState<RuleSource>(mode === 'create' && sourcePeriod ? 'keep' : 'new')

  const [name, setName] = useState(editingPeriod?.name ?? '')
  const [startDate, setStartDate] = useState(editingPeriod?.startDate ?? '')
  const [endDate, setEndDate] = useState(editingPeriod?.endDate ?? '')
  const [vidaEmissionGoal, setVidaEmissionGoal] = useState(String(base?.vidaEmissionGoal ?? ''))
  const [vidaEmissionMultiplier, setVidaEmissionMultiplier] = useState(String(base?.vidaEmissionMultiplier ?? '10'))
  const [icvGoal, setIcvGoal] = useState(base?.icvGoal != null ? String(base.icvGoal) : '')
  const [collectionGoal, setCollectionGoal] = useState(base?.collectionGoal != null ? String(base.collectionGoal) : '')
  const [notes, setNotes] = useState(base?.notes ?? '')

  const [incentiveRows, setIncentiveRows] = useState<TierRowState[]>(
    base ? incentiveRulesToRows(base.incentiveRules) : [newTierRow()],
  )
  const [collectionRows, setCollectionRows] = useState<TierRowState[]>(
    base ? factorRulesToRows(base.collectionFactorRules) : [newTierRow()],
  )
  const [icvRows, setIcvRows] = useState<TierRowState[]>(base ? factorRulesToRows(base.icvFactorRules) : [newTierRow()])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const readOnly = mode === 'view'
  const rulesReadOnly = readOnly || (mode === 'create' && ruleSource === 'keep')

  function applyRuleSource(next: RuleSource) {
    setRuleSource(next)
    if (!sourcePeriod) return
    if (next === 'new') {
      setIncentiveRows([newTierRow()])
      setCollectionRows([newTierRow()])
      setIcvRows([newTierRow()])
    } else {
      setIncentiveRows(incentiveRulesToRows(sourcePeriod.incentiveRules))
      setCollectionRows(factorRulesToRows(sourcePeriod.collectionFactorRules))
      setIcvRows(factorRulesToRows(sourcePeriod.icvFactorRules))
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Ingresa un nombre para el período.'
    if (!startDate) errors.startDate = 'Ingresa la fecha de inicio.'
    if (!endDate) errors.endDate = 'Ingresa la fecha de fin.'
    if (startDate && endDate && endDate < startDate) errors.endDate = 'La fecha de fin debe ser posterior a la de inicio.'
    const goal = Number(vidaEmissionGoal)
    if (!vidaEmissionGoal || !Number.isFinite(goal) || goal < 0) errors.vidaEmissionGoal = 'Ingresa una meta válida.'
    const multiplier = Number(vidaEmissionMultiplier)
    if (!vidaEmissionMultiplier || !Number.isFinite(multiplier) || multiplier <= 0) errors.vidaEmissionMultiplier = 'Ingresa un multiplicador válido.'
    if (rowsToIncentivePayload(incentiveRows).length === 0) errors.incentiveRows = 'Agrega al menos un tramo de incentivo.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (readOnly) return
    if (!validate()) return

    setSubmitting(true)
    const result = await onSubmit(
      {
        name: name.trim(),
        startDate,
        endDate,
        vidaEmissionGoal: Number(vidaEmissionGoal),
        vidaEmissionMultiplier: Number(vidaEmissionMultiplier),
        icvGoal: icvGoal ? Number(icvGoal) : null,
        collectionGoal: collectionGoal ? Number(collectionGoal) : null,
        notes: notes.trim() || null,
      },
      {
        incentiveRules: rowsToIncentivePayload(incentiveRows),
        collectionFactorRules: rowsToFactorPayload(collectionRows),
        icvFactorRules: rowsToFactorPayload(icvRows),
      },
    )
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'create' && sourcePeriod && (
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-slate-700">
              ¿Deseas utilizar las reglas del período anterior ({sourcePeriod.name})?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { value: 'keep', label: 'Mantener reglas anteriores', desc: 'Copia exacta, sin editar tramos.' },
                  { value: 'copy', label: 'Copiar y modificar', desc: 'Parte de las reglas anteriores y ajústalas.' },
                  { value: 'new', label: 'Crear reglas nuevas', desc: 'Empieza desde cero.' },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => applyRuleSource(opt.value)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    ruleSource === opt.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium text-slate-900">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Datos del período</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nombre" htmlFor="name" error={fieldErrors.name}>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={readOnly}
                placeholder="Ej. Setiembre 2026"
                className={fieldClass(!!fieldErrors.name)}
              />
            </FormField>
            <div />
            <FormField label="Fecha de inicio" htmlFor="startDate" error={fieldErrors.startDate}>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={readOnly}
                className={fieldClass(!!fieldErrors.startDate)}
              />
            </FormField>
            <FormField label="Fecha de fin" htmlFor="endDate" error={fieldErrors.endDate}>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={readOnly}
                className={fieldClass(!!fieldErrors.endDate)}
              />
            </FormField>
            <FormField label="Meta Emisión Vida (S/)" htmlFor="vidaEmissionGoal" error={fieldErrors.vidaEmissionGoal}>
              <input
                id="vidaEmissionGoal"
                type="number"
                min="0"
                step="0.01"
                value={vidaEmissionGoal}
                onChange={(e) => setVidaEmissionGoal(e.target.value)}
                disabled={readOnly}
                className={fieldClass(!!fieldErrors.vidaEmissionGoal)}
              />
            </FormField>
            <FormField
              label="Multiplicador Emisión Vida"
              htmlFor="vidaEmissionMultiplier"
              error={fieldErrors.vidaEmissionMultiplier}
              hint="Emisión Vida = Monto Afiliación × este multiplicador"
            >
              <input
                id="vidaEmissionMultiplier"
                type="number"
                min="0"
                step="0.1"
                value={vidaEmissionMultiplier}
                onChange={(e) => setVidaEmissionMultiplier(e.target.value)}
                disabled={readOnly}
                className={fieldClass(!!fieldErrors.vidaEmissionMultiplier)}
              />
            </FormField>
            <FormField label="Meta ICV (%)" htmlFor="icvGoal" hint="Opcional">
              <input
                id="icvGoal"
                type="number"
                min="0"
                step="0.01"
                value={icvGoal}
                onChange={(e) => setIcvGoal(e.target.value)}
                disabled={readOnly}
                className={fieldClass()}
              />
            </FormField>
            <FormField label="Objetivo de Cobranza (%)" htmlFor="collectionGoal" hint="Opcional">
              <input
                id="collectionGoal"
                type="number"
                min="0"
                step="0.01"
                value={collectionGoal}
                onChange={(e) => setCollectionGoal(e.target.value)}
                disabled={readOnly}
                className={fieldClass()}
              />
            </FormField>
          </div>
          <FormField label="Notas" htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={readOnly}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-6">
          <div>
            <TierEditor
              title="Tramos de % Incentivo (según Emisión Vida en S/)"
              rows={incentiveRows}
              onChange={setIncentiveRows}
              minLabel="Emisión Vida"
              valueLabel="% Incentivo"
              minUnit="S/"
              valueUnit="%"
              readOnly={rulesReadOnly}
            />
            {fieldErrors.incentiveRows && <p className="mt-1 text-xs text-red-600">{fieldErrors.incentiveRows}</p>}
          </div>
          <TierEditor
            title="Tramos de Factor Cobranza (según Ratio de Cobranza en %)"
            rows={collectionRows}
            onChange={setCollectionRows}
            minLabel="Ratio Cobranza"
            valueLabel="Factor"
            minUnit="%"
            readOnly={rulesReadOnly}
          />
          <TierEditor
            title="Tramos de Factor ICV (según % ICV)"
            rows={icvRows}
            onChange={setIcvRows}
            minLabel="% ICV"
            valueLabel="Factor"
            minUnit="%"
            readOnly={rulesReadOnly}
          />
        </CardBody>
      </Card>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear período'}
          </Button>
        )}
      </div>
    </form>
  )
}
