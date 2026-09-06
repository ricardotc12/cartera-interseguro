import { Users, UserPlus, TrendingUp, Percent, Wallet, Award, Activity, Gauge, CheckCircle2, Clock } from 'lucide-react'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { useIcvRecords } from '@/hooks/useIcvRecords'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { usePeriodsHistory } from '@/hooks/usePeriodsHistory'
import { useAffiliates } from '@/hooks/useAffiliates'
import { usePayments } from '@/hooks/usePayments'
import { calculatePeriodForDate, calculateGoalProgress } from '@/domain'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatCurrency, formatDate, formatPercentage, formatPoints } from '@/lib/format'
import { PERIOD_STATUS_TONE, PERIOD_STATUS_LABEL } from '@/lib/periodStatus'
import { IndicatorCard } from './IndicatorCard'
import { PeriodsHistoryCharts } from './PeriodsHistoryCharts'
import { PendingPaymentsList } from './PendingPaymentsList'
import { PeriodEndingBanner } from './PeriodEndingBanner'
import { WelcomeBanner } from './WelcomeBanner'
import { Skeleton, KpiGridSkeleton } from '@/components/ui/Skeleton'

export function DashboardPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(new Date().toISOString().slice(0, 10), periods)
  const { getForPeriod, loading: icvLoading } = useIcvRecords()
  const icvRecord = currentPeriod ? getForPeriod(currentPeriod.id) : null
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod, icvRecord?.icvPercentage ?? null)
  const { history, loading: historyLoading } = usePeriodsHistory(periods)
  const { affiliates, loading: affiliatesLoading } = useAffiliates()
  const { payments, loading: paymentsLoading } = usePayments()

  const loading = periodsLoading || icvLoading || metricsLoading || historyLoading || affiliatesLoading || paymentsLoading

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <KpiGridSkeleton />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (periodsError || metricsError) return <p className="text-sm text-red-600">{periodsError ?? metricsError}</p>
  if (!currentPeriod) {
    return (
      <div className="space-y-4">
        <WelcomeBanner />
        <NoPeriodNotice
          message="Configura el período correspondiente (fechas, metas y reglas) antes de ver cálculos en el Dashboard."
          latestPeriod={periods[0]}
        />
      </div>
    )
  }
  if (!metrics) return null

  const activeAffiliates = affiliates.filter((a) => a.status === 'activo').length
  const goalProgress = calculateGoalProgress(currentPeriod.vidaEmissionGoal, metrics.vidaEmission)

  return (
    <div className="space-y-4">
      <WelcomeBanner />
      <PeriodEndingBanner currentPeriod={currentPeriod} />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-4 text-white sm:px-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-100">Período vigente</p>
              <p className="text-lg font-semibold">{currentPeriod.name}</p>
              <p className="text-sm text-primary-100">
                {formatDate(currentPeriod.startDate)} — {formatDate(currentPeriod.endDate)}
              </p>
            </div>
            <Badge tone={PERIOD_STATUS_TONE[currentPeriod.status]} dot>
              {PERIOD_STATUS_LABEL[currentPeriod.status]}
            </Badge>
          </div>
        </div>
        <CardBody>
          <ProgressBar
            value={goalProgress.compliancePct}
            tone={goalProgress.compliancePct >= 1 ? 'success' : 'secondary'}
            label="Meta Emisión Vida"
            current={formatCurrency(metrics.vidaEmission)}
            target={formatCurrency(currentPeriod.vidaEmissionGoal)}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <IndicatorCard label="Afiliados activos" value={String(activeAffiliates)} icon={Users} tone="primary" />
        <IndicatorCard
          label="Nuevas afiliaciones"
          value={String(metrics.newPoliciesCount)}
          hint="en este período"
          icon={UserPlus}
          tone="secondary"
        />
        <IndicatorCard label="Emisión Vida" value={formatCurrency(metrics.vidaEmission)} icon={TrendingUp} tone="primary" />
        <IndicatorCard
          label="% Incentivo"
          value={metrics.incentivePercentage != null ? formatPercentage(metrics.incentivePercentage, 0) : '—'}
          icon={Percent}
          tone="secondary"
        />
        <IndicatorCard
          label="Incentivo Base"
          value={metrics.baseIncentive != null ? formatCurrency(metrics.baseIncentive) : '—'}
          icon={Wallet}
          tone="primary"
        />
        <IndicatorCard
          label="Incentivo Final"
          value={metrics.finalIncentive != null ? formatCurrency(metrics.finalIncentive) : '—'}
          icon={Award}
          tone="success"
        />
        <IndicatorCard
          label="Ratio Cobranza"
          value={metrics.collectionRatio != null ? formatPoints(metrics.collectionRatio) : '—'}
          hint={metrics.collectionFactor != null ? `Factor ${metrics.collectionFactor.toFixed(2)}` : undefined}
          icon={Activity}
          tone="secondary"
        />
        <IndicatorCard
          label="ICV"
          value={metrics.icvPercentage != null ? formatPoints(metrics.icvPercentage) : 'Sin registrar'}
          hint={metrics.icvFactor != null ? `Factor ${metrics.icvFactor.toFixed(2)}` : undefined}
          icon={Gauge}
          tone="secondary"
        />
        <IndicatorCard label="Pagos realizados" value={String(metrics.paidPaymentsCount)} icon={CheckCircle2} tone="success" />
        <IndicatorCard label="Pagos pendientes" value={String(metrics.pendingPaymentsCount)} icon={Clock} tone="warning" />
      </div>

      <PeriodsHistoryCharts history={history} />

      <PendingPaymentsList payments={payments} />
    </div>
  )
}
