import { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs } from '@/components/ui/Tabs'
import { useQuoteRates } from '@/hooks/useQuoteRates'
import { DEFAULT_COVERAGE_PERIODS } from '@/domain'
import type { QuoteSelection } from './QuoteSelectionPanel'
import { QuoteSimulatorTab } from './QuoteSimulatorTab'
import { CompareProtectionTab } from './CompareProtectionTab'
import { ComparePeriodsTab } from './ComparePeriodsTab'
import { ClientSummaryTab } from './ClientSummaryTab'
import { QuoteRatesAdminTab } from './QuoteRatesAdminTab'
import { CoverageGlossaryTab } from './CoverageGlossaryTab'

type QuoteTab = 'simulador' | 'comparar-proteccion' | 'comparar-periodos' | 'resumen-cliente' | 'base-datos' | 'glosario'

const QUOTE_TABS: { value: QuoteTab; label: string }[] = [
  { value: 'simulador', label: 'Simulador' },
  { value: 'comparar-proteccion', label: 'Compara Protección' },
  { value: 'comparar-periodos', label: 'Compara Períodos' },
  { value: 'resumen-cliente', label: 'Resumen Cliente' },
  { value: 'base-datos', label: 'BD Simulaciones' },
  { value: 'glosario', label: 'Glosario Coberturas' },
]

export function QuotesPage() {
  const { rates, loading, error, createRate, updateRate, deleteRate } = useQuoteRates()
  const [tab, setTab] = useState<QuoteTab>('simulador')
  const [selection, setSelection] = useState<QuoteSelection>({
    age: 30,
    product: '',
    plan: '',
    protectionType: 'integral',
    coverageYears: DEFAULT_COVERAGE_PERIODS[2] ?? DEFAULT_COVERAGE_PERIODS[0]!,
  })
  const initialized = useRef(false)

  const products = useMemo(() => Array.from(new Set(rates.map((r) => r.product))).sort(), [rates])
  const plansForProduct = useMemo(
    () => Array.from(new Set(rates.filter((r) => r.product === selection.product).map((r) => r.plan))).sort(),
    [rates, selection.product],
  )
  const coverageYearsOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_COVERAGE_PERIODS, ...rates.map((r) => r.coverageYears)])).sort((a, b) => a - b),
    [rates],
  )

  // Una sola vez, cuando ya cargaron las tarifas: si todavía no hay producto/plan elegido,
  // selecciona el primero disponible en vez de dejar los selectores vacíos. Nunca vuelve a
  // pisar una elección que la asesora ya haya hecho.
  useEffect(() => {
    if (initialized.current || loading || products.length === 0) return
    initialized.current = true
    const firstProduct = products[0]!
    const firstPlan = Array.from(new Set(rates.filter((r) => r.product === firstProduct).map((r) => r.plan))).sort()[0] ?? ''
    setSelection((s) => ({ ...s, product: firstProduct, plan: firstPlan }))
  }, [loading, products, rates])

  function handleSelectionChange(patch: Partial<QuoteSelection>) {
    setSelection((s) => {
      const next = { ...s, ...patch }
      // Cambiar de producto invalida el plan elegido si no pertenece al nuevo producto.
      if (patch.product !== undefined && patch.product !== s.product) {
        const plansForNewProduct = Array.from(new Set(rates.filter((r) => r.product === patch.product).map((r) => r.plan))).sort()
        next.plan = plansForNewProduct[0] ?? ''
      }
      return next
    })
  }

  const sharedProps = { rates, selection, onChange: handleSelectionChange, products, plansForProduct, coverageYearsOptions }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Cotizador referencial</h1>
        <p className="text-sm text-slate-500">
          Herramienta de pre-asesoría comercial — no reemplaza la cotización oficial de Interseguro.
        </p>
      </div>

      <Tabs tabs={QUOTE_TABS} value={tab} onChange={setTab} />

      {tab === 'simulador' && <QuoteSimulatorTab {...sharedProps} />}
      {tab === 'comparar-proteccion' && <CompareProtectionTab {...sharedProps} />}
      {tab === 'comparar-periodos' && <ComparePeriodsTab {...sharedProps} />}
      {tab === 'resumen-cliente' && <ClientSummaryTab {...sharedProps} />}
      {tab === 'base-datos' && (
        <QuoteRatesAdminTab rates={rates} loading={loading} error={error} createRate={createRate} updateRate={updateRate} deleteRate={deleteRate} />
      )}
      {tab === 'glosario' && <CoverageGlossaryTab />}
    </div>
  )
}
