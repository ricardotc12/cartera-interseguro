import { FormField, fieldClass } from '@/components/ui/FormField'
import { PROTECTION_TYPES, findAgeBand } from '@/domain'
import type { ProtectionType } from '@/types/domain'

export interface QuoteSelection {
  age: number
  product: string
  plan: string
  protectionType: ProtectionType
  coverageYears: number
}

interface QuoteSelectionPanelProps {
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  products: string[]
  plansForProduct: string[]
  coverageYearsOptions: number[]
  showProtectionType?: boolean
  showCoverageYears?: boolean
}

export function QuoteSelectionPanel({
  selection,
  onChange,
  products,
  plansForProduct,
  coverageYearsOptions,
  showProtectionType = true,
  showCoverageYears = true,
}: QuoteSelectionPanelProps) {
  const ageBand = findAgeBand(selection.age)

  return (
    <div className="space-y-4">
      <FormField label="Edad exacta del cliente (18-60 años)" htmlFor="quote-age">
        <div className="flex items-center gap-3">
          <input
            id="quote-age"
            type="range"
            min={18}
            max={60}
            value={selection.age}
            onChange={(e) => onChange({ age: Number(e.target.value) })}
            className="h-2 flex-1 accent-brand-600"
          />
          <input
            type="number"
            min={18}
            max={60}
            value={selection.age}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (Number.isFinite(v)) onChange({ age: Math.min(60, Math.max(18, v)) })
            }}
            className={`${fieldClass()} w-20 text-center`}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">Rango: {ageBand ? ageBand.label : 'fuera de rango'}</p>
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Producto" htmlFor="quote-product">
          {products.length === 0 ? (
            <p className="flex h-11 items-center text-sm text-slate-400">Sin productos registrados</p>
          ) : (
            <select
              id="quote-product"
              value={selection.product}
              onChange={(e) => onChange({ product: e.target.value })}
              className={fieldClass()}
            >
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Plan" htmlFor="quote-plan">
          {plansForProduct.length === 0 ? (
            <p className="flex h-11 items-center text-sm text-slate-400">Sin planes para este producto</p>
          ) : (
            <select id="quote-plan" value={selection.plan} onChange={(e) => onChange({ plan: e.target.value })} className={fieldClass()}>
              {plansForProduct.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      {showProtectionType && (
        <FormField label="Tipo de protección deseada" htmlFor="quote-protection">
          <div className="space-y-2">
            {PROTECTION_TYPES.map((pt) => (
              <label
                key={pt.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                  selection.protectionType === pt.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="quote-protection"
                  checked={selection.protectionType === pt.id}
                  onChange={() => onChange({ protectionType: pt.id })}
                  className="h-4 w-4 text-brand-600"
                />
                <span className="font-medium text-slate-900">{pt.label}</span>
              </label>
            ))}
          </div>
        </FormField>
      )}

      {showCoverageYears && (
        <FormField label="Período de cobertura" htmlFor="quote-period">
          <select
            id="quote-period"
            value={selection.coverageYears}
            onChange={(e) => onChange({ coverageYears: Number(e.target.value) })}
            className={fieldClass()}
          >
            {coverageYearsOptions.map((y) => (
              <option key={y} value={y}>
                {y} años
              </option>
            ))}
          </select>
        </FormField>
      )}
    </div>
  )
}
