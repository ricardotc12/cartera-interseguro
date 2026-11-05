import { useState } from 'react'
import { Users, UserPlus, TrendingUp, Percent, Wallet, Banknote, Award, Activity, Gauge, CheckCircle2, Clock } from 'lucide-react'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { useIcvRecords } from '@/hooks/useIcvRecords'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { usePeriodsHistory } from '@/hooks/usePeriodsHistory'
import { useAffiliates } from '@/hooks/useAffiliates'
import { usePayments } from '@/hooks/usePayments'
import { useProfile } from '@/hooks/useProfile'
import { useCollectionAlerts } from '@/hooks/useCollectionAlerts'
import { useContactReminders } from '@/hooks/useContactReminders'
import { calculatePeriodForDate, calculateGoalProgress, calculateDaysUntil, calculateVidaEmission, getCalendarMonthRange, MES_PONDERADO_GOAL } from '@/domain'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatCurrency, formatDate, formatIncentiveTierValue, formatPoints } from '@/lib/format'
import { today } from '@/lib/date'
import { PERIOD_STATUS_TONE, PERIOD_STATUS_LABEL } from '@/lib/periodStatus'
import { IndicatorCard } from './IndicatorCard'
import { PeriodsHistoryCharts } from './PeriodsHistoryCharts'
import { PendingPaymentsList } from './PendingPaymentsList'
import { PeriodEndingBanner, PERIOD_ENDING_WARNING_DAYS } from './PeriodEndingBanner'
import { CollectionAlertsModal } from './CollectionAlertsModal'
import { ContactRemindersModal } from '@/features/contacts/ContactRemindersModal'
import { QuoteExpiryRemindersModal } from '@/features/contacts/QuoteExpiryRemindersModal'
import { RealPolicyTotalModal } from './RealPolicyTotalModal'
import { RecaudoBonusCard } from './RecaudoBonusCard'
import { WelcomeBanner } from './WelcomeBanner'
import { Skeleton, KpiGridSkeleton } from '@/components/ui/Skeleton'

export function DashboardPage() {
  const [showPolicyTotal, setShowPolicyTotal] = useState(false)
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(today(), periods)
  const { getForPeriod, loading: icvLoading } = useIcvRecords()
  const icvRecord = currentPeriod ? getForPeriod(currentPeriod.id) : null
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod, icvRecord?.icvPercentage ?? null)
  const { history, loading: historyLoading } = usePeriodsHistory(periods)
  const { affiliates, loading: affiliatesLoading } = useAffiliates()
  const { payments, loading: paymentsLoading } = usePayments()
  const { profile, loading: profileLoading, setInterseguroStartDate } = useProfile()
  const { total: collectionAlertsTotal, loading: collectionAlertsLoading } = useCollectionAlerts()
  const { total: contactRemindersTotal, loading: contactRemindersLoading } = useContactReminders()

  const loading =
    periodsLoading || icvLoading || metricsLoading || historyLoading || affiliatesLoading || paymentsLoading || profileLoading

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

  // Periodo Mes Ponderado: calendario (1 al último día del mes), distinto del período de
  // incentivo del agente (16 al 15) — controla la renovación de contrato (REGLA confirmada:
  // mínimo fijo de S/ 13,500 de Emisión Vida de las pólizas emitidas ese mes calendario).
  const weightedMonthRange = getCalendarMonthRange(today())
  const weightedMonthEmission = affiliates
    .flatMap((a) => a.policies)
    .filter((p) => p.startDate >= weightedMonthRange.startDate && p.startDate <= weightedMonthRange.endDate)
    .reduce((sum, p) => sum + calculateVidaEmission(p.emissionAmount, currentPeriod.vidaEmissionMultiplier), 0)
  const weightedMonthProgress = calculateGoalProgress(MES_PONDERADO_GOAL, weightedMonthEmission)

  const periodDaysLeft = calculateDaysUntil(currentPeriod.endDate, today())
  const periodEndingSoon = periodDaysLeft >= 0 && periodDaysLeft <= PERIOD_ENDING_WARNING_DAYS
  const collectionAlertsShowing = !collectionAlertsLoading && !periodEndingSoon && collectionAlertsTotal > 0
  const contactRemindersShowing =
    !contactRemindersLoading && !periodEndingSoon && !collectionAlertsShowing && contactRemindersTotal > 0

  return (
    <div className="space-y-4">
      <WelcomeBanner />
      <PeriodEndingBanner currentPeriod={currentPeriod} />
      <CollectionAlertsModal suppressed={periodEndingSoon} />
      <ContactRemindersModal suppressed={periodEndingSoon || collectionAlertsShowing} />
      <QuoteExpiryRemindersModal suppressed={periodEndingSoon || collectionAlertsShowing || contactRemindersShowing} />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-4 text-white sm:px-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-100">Periodo Incentivo Agente</p>
              <p className="text-lg font-semibold">{currentPeriod.name}</p>
              <p className="text-sm text-primary-100">
                {formatDate(currentPeriod.startDate)} — {formatDate(currentPeriod.endDate)}
              </p>
            </div>
            <Badge tone={PERIOD_STATUS_TONE[currentPeriod.status]} dot>
              {PERIOD_STATUS_LABEL[currentPeriod.status]}
            </Badge>
          </div>
          <div className="mt-3 border-t border-white/20 pt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-100">Periodo Mes Ponderado</p>
            <p className="text-sm text-primary-100">
              {formatDate(weightedMonthRange.startDate)} — {formatDate(weightedMonthRange.endDate)}
            </p>
          </div>
        </div>
        <CardBody className="space-y-4">
          <ProgressBar
            value={goalProgress.compliancePct}
            tone={goalProgress.compliancePct >= 1 ? 'success' : 'secondary'}
            label="Meta Emisión Vida (Incentivo Agente)"
            current={formatCurrency(metrics.vidaEmission)}
            target={formatCurrency(currentPeriod.vidaEmissionGoal)}
          />
          <ProgressBar
            value={weightedMonthProgress.compliancePct}
            tone={weightedMonthProgress.compliancePct >= 1 ? 'success' : 'secondary'}
            label="Meta Mes Ponderado (renovación de contrato)"
            current={formatCurrency(weightedMonthEmission)}
            target={formatCurrency(MES_PONDERADO_GOAL)}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <IndicatorCard label="Afiliados activos" value={String(activeAffiliates)} icon={Users} tone="primary" />
        <IndicatorCard
          label="Nuevas afiliaciones"
          value={String(metrics.newAffiliatesCount)}
          hint="en este período"
          icon={UserPlus}
          tone="secondary"
        />
        <IndicatorCard label="Emisión Vida" value={formatCurrency(metrics.vidaEmission)} icon={TrendingUp} tone="primary" />
        <IndicatorCard
          label="Monto real de pólizas"
          value={formatCurrency(affiliates.flatMap((a) => a.policies).reduce((sum, p) => sum + p.collectionAmount, 0))}
          hint="Toca para ver el detalle"
          icon={Banknote}
          tone="success"
          onClick={() => setShowPolicyTotal(true)}
        />
        <IndicatorCard
          label="Tramo de Incentivo"
          value={formatIncentiveTierValue(metrics.incentiveTier)}
          hint={metrics.incentiveTier?.valueType === 'fixed' ? 'Monto fijo' : undefined}
          icon={Percent}
          tone="secondary"
        />
        <IndicatorCard
          label="Incentivo Base"
          value={metrics.baseIncentive != null ? formatCurrency(metrics.baseIncentive) : '—'}
          hint={profile?.showCollectionRatio && profile?.showIcv ? undefined : 'Sin Factor Cobranza/ICV aún'}
          icon={Wallet}
          tone="primary"
        />
        {profile?.showCollectionRatio && profile?.showIcv && (
          <IndicatorCard
            label="Incentivo Final"
            value={metrics.finalIncentive != null ? formatCurrency(metrics.finalIncentive) : '—'}
            hint="Incentivo Base × factores activos"
            icon={Award}
            tone="success"
          />
        )}
        {profile?.showCollectionRatio && (
          <IndicatorCard
            label="Ratio Cobranza"
            value={metrics.collectionRatio != null ? formatPoints(metrics.collectionRatio) : '—'}
            hint={metrics.collectionFactor != null ? `Factor ${metrics.collectionFactor.toFixed(2)}` : undefined}
            icon={Activity}
            tone="secondary"
          />
        )}
        {profile?.showIcv && (
          <IndicatorCard
            label="ICV"
            value={metrics.icvPercentage != null ? formatPoints(metrics.icvPercentage) : 'Sin registrar'}
            hint={metrics.icvFactor != null ? `Factor ${metrics.icvFactor.toFixed(2)}` : undefined}
            icon={Gauge}
            tone="secondary"
          />
        )}
        <IndicatorCard label="Pagos realizados" value={String(metrics.paidPaymentsCount)} icon={CheckCircle2} tone="success" />
        <IndicatorCard label="Pagos pendientes" value={String(metrics.pendingPaymentsCount)} icon={Clock} tone="warning" />
      </div>

      {profile && (
        <RecaudoBonusCard
          profile={profile}
          setInterseguroStartDate={setInterseguroStartDate}
          currentPeriod={currentPeriod}
          vidaEmission={metrics.vidaEmission}
          payments={payments}
        />
      )}

      <PeriodsHistoryCharts history={history} />

      <PendingPaymentsList payments={payments} />

      <RealPolicyTotalModal open={showPolicyTotal} onClose={() => setShowPolicyTotal(false)} affiliates={affiliates} />
    </div>
  )
}
