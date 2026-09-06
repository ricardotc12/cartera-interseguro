import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { useIcvRecords } from '@/hooks/useIcvRecords'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { calculatePeriodForDate, calculateGoalProgress } from '@/domain'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatCurrency, formatPercentage, formatPoints } from '@/lib/format'
import type { GoalProgress } from '@/types/domain'

function GoalCard({
  title,
  progress,
  formatGoal,
  formatActual,
}: {
  title: string
  progress: GoalProgress
  formatGoal: (v: number) => string
  formatActual: (v: number) => string
}) {
  const tone = progress.compliancePct >= 1 ? 'success' : progress.compliancePct >= 0.8 ? 'secondary' : 'warning'
  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardBody>
        <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
        <ProgressBar
          value={progress.compliancePct}
          tone={tone}
          label={formatPercentage(progress.compliancePct, 1) + ' cumplido'}
          current={formatActual(progress.actual)}
          target={formatGoal(progress.goal)}
        />
        {progress.remaining > 0 && <p className="mt-2 text-xs text-slate-400">Faltan {formatGoal(progress.remaining)}</p>}
      </CardBody>
    </Card>
  )
}

export function GoalsPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(new Date().toISOString().slice(0, 10), periods)
  const { getForPeriod, loading: icvLoading } = useIcvRecords()
  const icvRecord = currentPeriod ? getForPeriod(currentPeriod.id) : null
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod, icvRecord?.icvPercentage ?? null)

  const loading = periodsLoading || icvLoading || metricsLoading

  if (loading) return <p className="text-sm text-slate-500">Cargando metas…</p>
  if (periodsError || metricsError) return <p className="text-sm text-red-600">{periodsError ?? metricsError}</p>
  if (!currentPeriod) return <NoPeriodNotice message="Configura un período para ver el avance de tus metas." latestPeriod={periods[0]} />
  if (!metrics) return null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{currentPeriod.name}</h2>
        <p className="text-sm text-slate-500">Avance de metas del período vigente</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GoalCard
          title="Meta Emisión Vida"
          progress={calculateGoalProgress(currentPeriod.vidaEmissionGoal, metrics.vidaEmission)}
          formatGoal={formatCurrency}
          formatActual={formatCurrency}
        />

        {currentPeriod.collectionGoal != null && metrics.collectionRatio != null ? (
          <GoalCard
            title="Objetivo de Cobranza"
            progress={calculateGoalProgress(currentPeriod.collectionGoal, metrics.collectionRatio)}
            formatGoal={formatPoints}
            formatActual={formatPoints}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Objetivo de Cobranza</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-slate-400">
                {currentPeriod.collectionGoal == null
                  ? 'Este período no tiene un objetivo de cobranza configurado.'
                  : 'Aún no hay primas por cobrar registradas en este período.'}
              </p>
            </CardBody>
          </Card>
        )}

        {currentPeriod.icvGoal != null && icvRecord != null ? (
          <GoalCard
            title="Meta ICV"
            progress={calculateGoalProgress(currentPeriod.icvGoal, icvRecord.icvPercentage)}
            formatGoal={formatPoints}
            formatActual={formatPoints}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Meta ICV</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-slate-400">
                {currentPeriod.icvGoal == null ? 'Este período no tiene una meta de ICV configurada.' : 'Aún no registras el % ICV de este período.'}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
