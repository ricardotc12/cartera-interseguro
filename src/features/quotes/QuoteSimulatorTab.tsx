import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { findQuoteRate, findProtectionType } from '@/domain'
import type { QuoteRate } from '@/types/domain'
import { QuoteSelectionPanel, type QuoteSelection } from './QuoteSelectionPanel'
import { PreliminaryBadge, PreliminaryDisclaimer, MoneyValue, PercentValue, CoverageList } from './shared'

interface QuoteSimulatorTabProps {
  rates: QuoteRate[]
  selection: QuoteSelection
  onChange: (patch: Partial<QuoteSelection>) => void
  products: string[]
  plansForProduct: string[]
  coverageYearsOptions: number[]
}

export function QuoteSimulatorTab({ rates, selection, onChange, products, plansForProduct, coverageYearsOptions }: QuoteSimulatorTabProps) {
  const rate = findQuoteRate(rates, selection)
  const protectionDef = findProtectionType(selection.protectionType)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardBody>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Configuración de la asesoría</h3>
          <QuoteSelectionPanel
            selection={selection}
            onChange={onChange}
            products={products}
            plansForProduct={plansForProduct}
            coverageYearsOptions={coverageYearsOptions}
          />
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-4 text-white sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary-100">Simulación para {selection.age} años</p>
                <p className="text-lg font-semibold">Referencia de inversión</p>
              </div>
              <Badge tone="neutral" dot>
                {protectionDef.label}
              </Badge>
            </div>
          </div>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Prima mensual referencial</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  <MoneyValue value={rate?.primaMensual ?? null} />
                </p>
              </div>
              <div className="rounded-lg bg-primary-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Prima anual referencial</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  <MoneyValue value={rate?.primaAnual ?? null} />
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">Monto asegurado</p>
                <p className="text-sm font-semibold text-slate-900">
                  <MoneyValue value={rate?.montoAsegurado ?? null} />
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">% Devolución</p>
                <p className="text-sm font-semibold text-slate-900">
                  <PercentValue value={rate?.pctDevolucion ?? null} />
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total devolución</p>
                <p className="text-sm font-semibold text-emerald-700">
                  <MoneyValue value={rate?.totalDevolucion ?? null} />
                </p>
              </div>
            </div>

            {!rate && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No hay una tarifa registrada para esta combinación todavía. Agrégala en la pestaña "Base de datos".
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">¿Qué protección incluye esta opción?</h3>
            <CoverageList protectionType={selection.protectionType} />
          </CardBody>
        </Card>

        <div className="flex justify-between gap-3">
          <PreliminaryBadge />
        </div>
        <PreliminaryDisclaimer />
      </div>
    </div>
  )
}
