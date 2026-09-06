import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/FormField'

export interface TierRowState {
  id: string
  min: string
  max: string
  value: string
}

interface TierEditorProps {
  title: string
  rows: TierRowState[]
  /** El setter de useState tal cual (soporta forma funcional) para no perder filas con clics rápidos consecutivos. */
  onChange: Dispatch<SetStateAction<TierRowState[]>>
  minLabel: string
  valueLabel: string
  /** Símbolo mostrado en los campos "desde/hasta" (ej. "%", "S/"). */
  minUnit?: string
  /** Símbolo mostrado en el campo de valor (ej. "%" para incentivo; vacío para un factor decimal). */
  valueUnit?: string
  readOnly?: boolean
}

let nextId = 0
export function newTierRow(): TierRowState {
  nextId += 1
  return { id: `new-${Date.now()}-${nextId}`, min: '', max: '', value: '' }
}

/** Al salir del campo, normaliza a 2 decimales (si es un número válido) para que se vea "64.99" en vez de "64.9900000". */
function normalizeOnBlur(raw: string): string {
  if (raw.trim() === '') return raw
  const n = Number(raw)
  return Number.isFinite(n) ? n.toFixed(2) : raw
}

function UnitInput({
  value,
  onChange,
  placeholder,
  disabled,
  unit,
  unitPosition = 'suffix',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  unit?: string
  unitPosition?: 'prefix' | 'suffix'
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(normalizeOnBlur(e.target.value))}
        type="number"
        step="0.01"
        placeholder={placeholder}
        disabled={disabled}
        className={`${fieldClass()} ${unit ? (unitPosition === 'prefix' ? 'pl-9' : 'pr-8') : ''}`}
      />
      {unit && (
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-slate-400 ${
            unitPosition === 'prefix' ? 'left-3' : 'right-3'
          }`}
        >
          {unit}
        </span>
      )}
    </div>
  )
}

export function TierEditor({ title, rows, onChange, minLabel, valueLabel, minUnit, valueUnit, readOnly }: TierEditorProps) {
  function updateRow(id: string, patch: Partial<TierRowState>) {
    onChange((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeRow(id: string) {
    onChange((prev) => prev.filter((r) => r.id !== id))
  }

  const minUnitPosition = minUnit === 'S/' ? 'prefix' : 'suffix'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        {!readOnly && (
          <Button type="button" size="sm" variant="secondary" onClick={() => onChange((prev) => [...prev, newTierRow()])}>
            <Plus className="h-4 w-4" />
            Agregar tramo
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tramos configurados.</p>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span>{minLabel} desde</span>
            <span>{minLabel} hasta (vacío = sin límite)</span>
            <span>{valueLabel}</span>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <UnitInput
                value={row.min}
                onChange={(v) => updateRow(row.id, { min: v })}
                placeholder="Desde"
                disabled={readOnly}
                unit={minUnit}
                unitPosition={minUnitPosition}
              />
              <UnitInput
                value={row.max}
                onChange={(v) => updateRow(row.id, { max: v })}
                placeholder="Sin límite"
                disabled={readOnly}
                unit={minUnit}
                unitPosition={minUnitPosition}
              />
              <UnitInput
                value={row.value}
                onChange={(v) => updateRow(row.id, { value: v })}
                placeholder={valueLabel}
                disabled={readOnly}
                unit={valueUnit}
                unitPosition="suffix"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar tramo"
                  aria-label="Eliminar tramo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
