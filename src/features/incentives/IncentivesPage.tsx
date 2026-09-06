import { ArrowDown } from 'lucide-react'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { useIcvRecords } from '@/hooks/useIcvRecords'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { calculatePeriodForDate } from '@/domain'
import { Card, CardBody } from '@/components/ui/Card'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatCurrency, formatPercentage, formatPoints } from '@/lib/format'

function Step({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </CardBody>
    </Card>
  )
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <ArrowDown className="h-5 w-5 text-slate-300" />
    </div>
  )
}

export function IncentivesPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(new Date().toISOString().slice(0, 10), periods)
  const { getForPeriod, loading: icvLoading } = useIcvRecords()
  const icvRecord = currentPeriod ? getForPeriod(currentPeriod.id) : null
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod, icvRecord?.icvPercentage ?? null)

  const loading = periodsLoading || icvLoading || metricsLoading

  if (loading) return <p className="text-sm text-slate-500">Calculando incentivo…</p>
  if (periodsError || metricsError) return <p className="text-sm text-red-600">{periodsError ?? metricsError}</p>
  if (!currentPeriod) return <NoPeriodNotice message="Configura un período para calcular tu incentivo." latestPeriod={periods[0]} />
  if (!metrics) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{currentPeriod.name}</h2>
        <p className="text-sm text-slate-500">
          {metrics.newPoliciesCount} póliza(s) nueva(s) en este período · Monto total afiliación {formatCurrency(metrics.totalAffiliationAmount)}
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-2">
        <Step label="Emisión Vida" value={formatCurrency(metrics.vidaEmission)} hint={`Monto afiliación × ${currentPeriod.vidaEmissionMultiplier}`} />
        <Arrow />
        <Step
          label="% Incentivo"
          value={metrics.incentivePercentage != null ? formatPercentage(metrics.incentivePercentage, 0) : 'Sin tramo configurado'}
        />
        <Arrow />
        <Step label="Incentivo Base" value={metrics.baseIncentive != null ? formatCurrency(metrics.baseIncentive) : '—'} />
        <Arrow />
        <Step
          label="Factor Cobranza"
          value={metrics.collectionFactor != null ? metrics.collectionFactor.toFixed(2) : '—'}
          hint={metrics.collectionRatio != null ? `Ratio Cobranza: ${formatPoints(metrics.collectionRatio)}` : 'Sin primas por cobrar aún'}
        />
        <Arrow />
        <Step
          label="Factor ICV"
          value={metrics.icvFactor != null ? metrics.icvFactor.toFixed(2) : '—'}
          hint={metrics.icvPercentage != null ? `ICV: ${formatPoints(metrics.icvPercentage)}` : 'ICV aún no registrado'}
        />
        <Arrow />
        <Card className="border-brand-200 bg-brand-50">
          <CardBody className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Incentivo Final</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              {metrics.finalIncentive != null ? formatCurrency(metrics.finalIncentive) : '—'}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
