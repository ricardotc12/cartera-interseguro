import { Card, CardBody } from '@/components/ui/Card'
import { findQuoteRate, findProtectionType } from '@/domain'
import type { QuoteRate } from '@/types/domain'
import { QuoteSelectionPanel, type QuoteSelection } from './QuoteSelectionPanel'
import { PreliminaryBadge, PreliminaryDisclaimer, MoneyValue, PercentValue } from './shared'

interface ComparePeriodsTabProps {
  rates: QuoteRate[]
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  products: string[]
  plansForProduct: string[]
  coverageYearsOptions: number[]
}

const ROWS: { key: 'primaMensual' | 'primaAnual' | 'montoAsegurado' | 'pctDevolucion' | 'totalDevolucion'; label: string; kind: 'money' | 'percent' }[] = [
  { key: 'primaMensual', label: 'Prima mensual', kind: 'money' },
  { key: 'primaAnual', label: 'Prima anual', kind: 'money' },
  { key: 'montoAsegurado', label: 'Monto asegurado', kind: 'money' },
  { key: 'pctDevolucion', label: '% Devolución', kind: 'percent' },
  { key: 'totalDevolucion', label: 'Total devolución', kind: 'money' },
]

export function ComparePeriodsTab({ rates, selection, onChange, products, plansForProduct, coverageYearsOptions }: ComparePeriodsTabProps) {
  const protectionDef = findProtectionType(selection.protectionType)

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <QuoteSelectionPanel
            selection={selection}
            onChange={onChange}
            products={products}
            plansForProduct={plansForProduct}
            coverageYearsOptions={coverageYearsOptions}
            showCoverageYears={false}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Compara las alternativas por períodos</h2>
          <p className="text-sm text-slate-500">
            Edad: {selection.age} años · Protección: {protectionDef.label}
          </p>
        </div>
        <PreliminaryBadge />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Concepto</th>
                {coverageYearsOptions.map((years) => (
                  <th key={years} className={`px-4 py-3 text-center font-medium ${years === selection.coverageYears ? 'text-brand-700' : ''}`}>
                    {years} años
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                  {coverageYearsOptions.map((years) => {
                    const rate = findQuoteRate(rates, { ...selection, coverageYears: years })
                    const value = rate ? rate[row.key] : null
                    return (
                      <td
                        key={years}
                        className={`px-4 py-3 text-center ${years === selection.coverageYears ? 'bg-brand-50 font-semibold text-slate-900' : 'text-slate-600'}`}
                      >
                        {row.kind === 'money' ? <MoneyValue value={value} /> : <PercentValue value={value} />}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <PreliminaryDisclaimer />
    </div>
  )
}
