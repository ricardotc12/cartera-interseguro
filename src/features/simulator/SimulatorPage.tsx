import { useMemo, useState } from 'react'
import { usePeriodsAdmin, type PeriodWithRules } from '@/hooks/usePeriodsAdmin'
import { calculatePeriodForDate, calculateVidaEmission, calculateIncentivePercentage, calculateBaseIncentive, calculateCollectionFactor, calculateICVFactor, calculateFinalIncentive } from '@/domain'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatCurrency, formatPercentage } from '@/lib/format'

function useSimulation(period: PeriodWithRules | undefined, affiliationsCount: string, avgAmount: string, collectionRatio: string, icvRatio: string) {
  return useMemo(() => {
    if (!period) return null
    const count = Number(affiliationsCount) || 0
    const amount = Number(avgAmount) || 0
    const totalAffiliation = count * amount
    const vidaEmission = calculateVidaEmission(totalAffiliation, period.vidaEmissionMultiplier)
    const incentivePercentage = calculateIncentivePercentage(vidaEmission, period.incentiveRules)
    const baseIncentive = incentivePercentage != null ? calculateBaseIncentive(vidaEmission, incentivePercentage) : null

    const ratio = collectionRatio === '' ? null : Number(collectionRatio)
    const collectionFactor = ratio != null ? calculateCollectionFactor(ratio, period.collectionFactorRules) : null

    const icv = icvRatio === '' ? null : Number(icvRatio)
    const icvFactor = icv != null ? calculateICVFactor(icv, period.icvFactorRules) : null

    const finalIncentive =
      baseIncentive != null && collectionFactor != null && icvFactor != null
        ? calculateFinalIncentive(baseIncentive, collectionFactor, icvFactor)
        : null

    return { totalAffiliation, vidaEmission, incentivePercentage, baseIncentive, collectionFactor, icvFactor, finalIncentive }
  }, [period, affiliationsCount, avgAmount, collectionRatio, icvRatio])
}

export function SimulatorPage() {
  const { periods, loading, error } = usePeriodsAdmin()
  const defaultPeriod = calculatePeriodForDate(new Date().toISOString().slice(0, 10), periods) ?? periods[0]

  const [periodId, setPeriodId] = useState<string | undefined>(undefined)
  const selectedPeriod = periods.find((p) => p.id === periodId) ?? defaultPeriod

  const [affiliationsCount, setAffiliationsCount] = useState('10')
  const [avgAmount, setAvgAmount] = useState('300')
  const [collectionRatio, setCollectionRatio] = useState('85')
  const [icvRatio, setIcvRatio] = useState('80')

  const result = useSimulation(selectedPeriod, affiliationsCount, avgAmount, collectionRatio, icvRatio)

  if (loading) return <p className="text-sm text-slate-500">Cargando simulador…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!selectedPeriod) return <NoPeriodNotice message="Configura al menos un período para poder simular." latestPeriod={periods[0]} />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simular sobre el período</CardTitle>
        </CardHeader>
        <CardBody>
          <select value={selectedPeriod.id} onChange={(e) => setPeriodId(e.target.value)} className={fieldClass()}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos a simular</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Número de afiliaciones" htmlFor="count">
              <input
                id="count"
                type="number"
                min="0"
                value={affiliationsCount}
                onChange={(e) => setAffiliationsCount(e.target.value)}
                className={fieldClass()}
              />
            </FormField>
            <FormField label="Monto promedio de afiliación (S/)" htmlFor="avgAmount">
              <input
                id="avgAmount"
                type="number"
                min="0"
                step="0.01"
                value={avgAmount}
                onChange={(e) => setAvgAmount(e.target.value)}
                className={fieldClass()}
              />
            </FormField>
            <FormField label="Cobranza esperada (%)" htmlFor="collectionRatio" hint="Déjalo vacío si no quieres estimarla">
              <input
                id="collectionRatio"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={collectionRatio}
                onChange={(e) => setCollectionRatio(e.target.value)}
                className={fieldClass()}
              />
            </FormField>
            <FormField label="ICV esperado (%)" htmlFor="icvRatio" hint="Déjalo vacío si no quieres estimarlo">
              <input
                id="icvRatio"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={icvRatio}
                onChange={(e) => setIcvRatio(e.target.value)}
                className={fieldClass()}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Row label="Total afiliaciones" value={formatCurrency(result?.totalAffiliation ?? 0)} />
            <Row label="Emisión Vida" value={formatCurrency(result?.vidaEmission ?? 0)} />
            <Row
              label="% Incentivo"
              value={result?.incentivePercentage != null ? formatPercentage(result.incentivePercentage, 0) : 'Sin tramo configurado'}
            />
            <Row label="Incentivo Base" value={result?.baseIncentive != null ? formatCurrency(result.baseIncentive) : '—'} />
            <Row label="Factor Cobranza" value={result?.collectionFactor != null ? result.collectionFactor.toFixed(2) : '—'} />
            <Row label="Factor ICV" value={result?.icvFactor != null ? result.icvFactor.toFixed(2) : '—'} />
            <div className="mt-2 rounded-lg bg-brand-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Incentivo Final estimado</p>
              <p className="mt-1 text-3xl font-bold text-brand-700">
                {result?.finalIncentive != null ? formatCurrency(result.finalIncentive) : '—'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}
