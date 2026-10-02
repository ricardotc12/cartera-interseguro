import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { findQuoteRate, PROTECTION_TYPES } from '@/domain'
import type { QuoteRate } from '@/types/domain'
import { QuoteSelectionPanel, type QuoteSelection } from './QuoteSelectionPanel'
import { PreliminaryBadge, PreliminaryDisclaimer, MoneyValue, PercentValue, CoverageList } from './shared'

interface CompareProtectionTabProps {
  rates: QuoteRate[]
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  products: string[]
  plansForProduct: string[]
  coverageYearsOptions: number[]
}

export function CompareProtectionTab({
  rates,
  selection,
  onChange,
  products,
  plansForProduct,
  coverageYearsOptions,
}: CompareProtectionTabProps) {
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
            showProtectionType={false}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Compara tus alternativas de protección</h2>
          <p className="text-sm text-slate-500">
            Edad: {selection.age} años · Período: {selection.coverageYears} años
          </p>
        </div>
        <PreliminaryBadge />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PROTECTION_TYPES.map((pt) => {
          const rate = findQuoteRate(rates, { ...selection, protectionType: pt.id })
          return (
            <Card key={pt.id}>
              <CardHeader>
                <p className="text-base font-semibold text-slate-900">{pt.label}</p>
                <p className="text-xs text-slate-400">Cobertura por {selection.coverageYears} años</p>
              </CardHeader>
              <CardBody className="space-y-3">
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Prima mensual</dt>
                    <dd className="font-semibold text-slate-900">
                      <MoneyValue value={rate?.primaMensual ?? null} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Prima anual</dt>
                    <dd className="font-medium text-slate-900">
                      <MoneyValue value={rate?.primaAnual ?? null} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Monto asegurado</dt>
                    <dd className="font-medium text-slate-900">
                      <MoneyValue value={rate?.montoAsegurado ?? null} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">% Devolución</dt>
                    <dd className="font-medium text-slate-900">
                      <PercentValue value={rate?.pctDevolucion ?? null} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Total devolución</dt>
                    <dd className="font-medium text-emerald-700">
                      <MoneyValue value={rate?.totalDevolucion ?? null} />
                    </dd>
                  </div>
                </dl>
                <div className="border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Coberturas</p>
                  <CoverageList protectionType={pt.id} />
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      <PreliminaryDisclaimer />
    </div>
  )
}
