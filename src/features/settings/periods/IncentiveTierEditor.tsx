import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/FormField'
import { UnitInput } from './TierEditor'

export type IncentiveValueType = 'fixed' | 'percentage'

export interface IncentiveTierRowState {
  id: string
  min: string
  max: string
  valueType: IncentiveValueType
  value: string
}

let nextId = 0
export function newIncentiveTierRow(): IncentiveTierRowState {
  nextId += 1
  return { id: `new-${Date.now()}-${nextId}`, min: '', max: '', valueType: 'fixed', value: '' }
}

interface IncentiveTierEditorProps {
  rows: IncentiveTierRowState[]
  onChange: Dispatch<SetStateAction<IncentiveTierRowState[]>>
  readOnly?: boolean
}

/**
 * Editor de tramos de incentivo según Emisión Vida. A diferencia de Factor
 * Cobranza/ICV (siempre un factor decimal), cada tramo de incentivo puede ser
 * un MONTO FIJO en soles o un PORCENTAJE — hoy Interseguro maneja los tramos
 * más bajos como monto fijo y solo el más alto como porcentaje real (ver
 * imagen de referencia); cuando confirme el esquema por porcentajes, cada
 * tramo se reconfigura acá mismo sin tocar código.
 */
export function IncentiveTierEditor({ rows, onChange, readOnly }: IncentiveTierEditorProps) {
  function updateRow(id: string, patch: Partial<IncentiveTierRowState>) {
    onChange((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeRow(id: string) {
    onChange((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700">Tramos de Incentivo (según Emisión Vida en S/)</h4>
        {!readOnly && (
          <Button type="button" size="sm" variant="secondary" onClick={() => onChange((prev) => [...prev, newIncentiveTierRow()])}>
            <Plus className="h-4 w-4" />
            Agregar tramo
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tramos configurados.</p>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_150px_1fr_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span>Emisión Vida desde</span>
            <span>Emisión Vida hasta (vacío = sin límite)</span>
            <span>Tipo</span>
            <span>Valor</span>
            <span />
          </div>
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_150px_1fr_auto]">
              <UnitInput
                value={row.min}
                onChange={(v) => updateRow(row.id, { min: v })}
                placeholder="Desde"
                disabled={readOnly}
                unit="S/"
                unitPosition="prefix"
              />
              <UnitInput
                value={row.max}
                onChange={(v) => updateRow(row.id, { max: v })}
                placeholder="Sin límite"
                disabled={readOnly}
                unit="S/"
                unitPosition="prefix"
              />
              <select
                value={row.valueType}
                onChange={(e) => updateRow(row.id, { valueType: e.target.value as IncentiveValueType })}
                disabled={readOnly}
                className={fieldClass()}
              >
                <option value="fixed">Monto fijo (S/)</option>
                <option value="percentage">% Incentivo</option>
              </select>
              <UnitInput
                value={row.value}
                onChange={(v) => updateRow(row.id, { value: v })}
                placeholder={row.valueType === 'fixed' ? 'Monto' : '%'}
                disabled={readOnly}
                unit={row.valueType === 'fixed' ? 'S/' : '%'}
                unitPosition={row.valueType === 'fixed' ? 'prefix' : 'suffix'}
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
