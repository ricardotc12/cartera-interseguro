import { Lightbulb } from 'lucide-react'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { calculatePeriodForDate, findNextTier } from '@/domain'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { formatPoints } from '@/lib/format'

export function CollectionFactorPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(new Date().toISOString().slice(0, 10), periods)
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod, null)

  const loading = periodsLoading || metricsLoading

  if (loading) return <p className="text-sm text-slate-500">Calculando Ratio de Cobranza…</p>
  if (periodsError || metricsError) return <p className="text-sm text-red-600">{periodsError ?? metricsError}</p>
  if (!currentPeriod) return <NoPeriodNotice message="Configura un período para calcular tu Factor Cobranza." latestPeriod={periods[0]} />
  if (!metrics) return null

  const nextTier = metrics.collectionRatio != null ? findNextTier(metrics.collectionRatio, currentPeriod.collectionFactorRules) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ratio de Cobranza</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">
              {metrics.collectionRatio != null ? formatPoints(metrics.collectionRatio) : 'Sin datos'}
            </p>
            <p className="mt-1 text-xs text-slate-400">Primas cobradas / primas por cobrar en {currentPeriod.name} (sin reprogramadas)</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Factor Cobranza</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{metrics.collectionFactor != null ? metrics.collectionFactor.toFixed(2) : '—'}</p>
            {metrics.collectionRatio != null && metrics.collectionFactor == null && (
              <p className="mt-1 text-xs text-amber-600">El ratio no cae en ningún tramo configurado para este período.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {nextTier && metrics.collectionRatio != null && (
        <Card className="border-brand-200 bg-brand-50">
          <CardBody className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-800">
              Tu Ratio de Cobranza es {formatPoints(metrics.collectionRatio)}. Si alcanzas {formatPoints(nextTier.min)}, tu Factor
              Cobranza sube de {metrics.collectionFactor?.toFixed(2)} a {nextTier.factor.toFixed(2)}.
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tramos configurados para {currentPeriod.name}</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Desde</th>
                <th className="px-4 py-2 font-medium">Hasta</th>
                <th className="px-4 py-2 font-medium">Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPeriod.collectionFactorRules.map((rule) => {
                const active = metrics.collectionRatio != null && metrics.collectionRatio >= rule.min && (rule.max === null || metrics.collectionRatio <= rule.max)
                return (
                  <tr key={rule.id} className={active ? 'bg-brand-50 font-medium text-brand-800' : 'text-slate-600'}>
                    <td className="px-4 py-2">{formatPoints(rule.min)}</td>
                    <td className="px-4 py-2">{rule.max != null ? formatPoints(rule.max) : 'En adelante'}</td>
                    <td className="px-4 py-2">{rule.factor.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
