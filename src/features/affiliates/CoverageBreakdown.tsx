import { Info } from 'lucide-react'
import { fieldClass } from '@/components/ui/FormField'
import { formatCurrency } from '@/lib/format'
import { COVERAGES, calculateCollectionAmount, calculateEmissionAmount } from '@/domain'
import type { CoverageCode, Modalidad, PolicyCoverage } from '@/types/domain'

export interface CoverageRowState {
  code: CoverageCode
  checked: boolean
  /** String para enlazar directo al input; '' = aún no se ingresa monto. */
  amount: string
}

const MODALIDAD_OPTIONS: { value: Modalidad; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

/** Arranca el checklist: las 2 coberturas obligatorias siempre marcadas; en edición, precarga montos/marcas existentes. */
export function createInitialCoverageRows(existing?: PolicyCoverage[]): CoverageRowState[] {
  return COVERAGES.map(({ code, mandatory }) => {
    const current = existing?.find((c) => c.coverageCode === code)
    return { code, checked: mandatory || !!current, amount: current ? String(current.amount) : '' }
  })
}

/** Solo las coberturas marcadas con un monto numérico válido pasan a guardarse. */
export function coverageRowsToInputs(rows: CoverageRowState[]): { coverageCode: CoverageCode; amount: number }[] {
  return rows
    .filter((r) => r.checked && r.amount !== '' && Number.isFinite(Number(r.amount)))
    .map((r) => ({ coverageCode: r.code, amount: Number(r.amount) }))
}

/** Toda cobertura marcada necesita un monto válido (>= 0) ingresado para poder guardar la póliza. */
export function validateCoverageRows(rows: CoverageRowState[]): string | null {
  const missing = rows.some((r) => r.checked && (r.amount === '' || !Number.isFinite(Number(r.amount)) || Number(r.amount) < 0))
  return missing ? 'Ingresa un monto válido para cada cobertura marcada.' : null
}

interface CoverageBreakdownProps {
  rows: CoverageRowState[]
  onChange: (rows: CoverageRowState[]) => void
  modalidad: Modalidad
  onModalidadChange: (modalidad: Modalidad) => void
  error?: string | null
}

export function CoverageBreakdown({ rows, onChange, modalidad, onModalidadChange, error }: CoverageBreakdownProps) {
  const inputs = coverageRowsToInputs(rows)
  const emissionAmount = calculateEmissionAmount(inputs)
  const collectionAmount = calculateCollectionAmount(inputs)

  function updateRow(code: CoverageCode, patch: Partial<CoverageRowState>) {
    onChange(rows.map((r) => (r.code === code ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="modalidad" className="mb-1 block text-sm font-medium text-slate-700">
          Modalidad
        </label>
        <select
          id="modalidad"
          value={modalidad}
          onChange={(e) => onModalidadChange(e.target.value as Modalidad)}
          className={fieldClass()}
        >
          {MODALIDAD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">Cada cuántos meses le toca pagar al cliente.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Desglose de coberturas</p>
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          {rows.map((row) => {
            const def = COVERAGES.find((c) => c.code === row.code)!
            return (
              <div key={row.code} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={row.checked}
                  disabled={def.mandatory}
                  onChange={(e) => updateRow(row.code, { checked: e.target.checked, amount: e.target.checked ? row.amount : '' })}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 disabled:opacity-60"
                />
                <span className={`min-w-0 flex-1 text-sm ${def.mandatory ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                  {def.label}
                  {def.mandatory && <span className="ml-1 text-xs text-slate-400">(obligatoria)</span>}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="S/"
                  value={row.amount}
                  disabled={!row.checked}
                  onChange={(e) => updateRow(row.code, { amount: e.target.value })}
                  className="h-9 w-28 shrink-0 rounded-lg border border-slate-300 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            )
          })}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Monto de Emisión (Comisionable)</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(emissionAmount)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Monto de Cobranza (Recaudo Cliente)</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(collectionAmount)}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>El Monto de Emisión impacta en el cálculo de sueldo/meta; el Monto de Cobranza impacta en la efectividad de recaudo.</p>
      </div>
    </div>
  )
}
