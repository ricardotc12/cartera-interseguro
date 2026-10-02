import { Card, CardBody } from '@/components/ui/Card'
import { findQuoteRate, findProtectionType } from '@/domain'
import type { QuoteRate } from '@/types/domain'
import { QuoteSelectionPanel, type QuoteSelection } from './QuoteSelectionPanel'
import { MoneyValue, PercentValue, CoverageList, PreliminaryDisclaimer } from './shared'

interface ClientSummaryTabProps {
  rates: QuoteRate[]
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  products: string[]
  plansForProduct: string[]
  coverageYearsOptions: number[]
}

/** Vista limpia pensada para tomar una captura o compartir en videollamada (sección 14): solo lo que el cliente necesita ver, sin IDs ni información técnica. */
export function ClientSummaryTab({ rates, selection, onChange, products, plansForProduct, coverageYearsOptions }: ClientSummaryTabProps) {
  const rate = findQuoteRate(rates, selection)
  const protectionDef = findProtectionType(selection.protectionType)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardBody>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Ajustar</h3>
          <QuoteSelectionPanel
            selection={selection}
            onChange={onChange}
            products={products}
            plansForProduct={plansForProduct}
            coverageYearsOptions={coverageYearsOptions}
          />
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-primary-700 px-6 py-5 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-100">Interseguro · Propuesta de orientación comercial</p>
          <p className="mt-1 text-2xl font-semibold">{protectionDef.label}</p>
        </div>
        <CardBody className="space-y-6 p-6 sm:p-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Edad</p>
              <p className="text-lg font-semibold text-slate-900">{selection.age} años</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Protección</p>
              <p className="text-lg font-semibold text-slate-900">{protectionDef.label}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Período</p>
              <p className="text-lg font-semibold text-slate-900">{selection.coverageYears} años</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Prima mensual referencial</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                <MoneyValue value={rate?.primaMensual ?? null} />
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Prima anual referencial</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                <MoneyValue value={rate?.primaAnual ?? null} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Monto asegurado</p>
              <p className="text-base font-semibold text-slate-900">
                <MoneyValue value={rate?.montoAsegurado ?? null} />
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">% Devolución</p>
              <p className="text-base font-semibold text-slate-900">
                <PercentValue value={rate?.pctDevolucion ?? null} />
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total devolución</p>
              <p className="text-base font-semibold text-emerald-700">
                <MoneyValue value={rate?.totalDevolucion ?? null} />
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Coberturas incluidas</p>
            <div className="mx-auto max-w-xs">
              <CoverageList protectionType={selection.protectionType} />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-700">
            Valores referenciales / Simulación preliminar
          </div>
          <PreliminaryDisclaimer />
        </CardBody>
      </Card>
    </div>
  )
}
