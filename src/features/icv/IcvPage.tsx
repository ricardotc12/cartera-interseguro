import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { usePeriodMetrics } from '@/hooks/usePeriodMetrics'
import { useProfile } from '@/hooks/useProfile'
import { useState } from 'react'
import { calculatePeriodForDate } from '@/domain'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { SwitchField } from '@/components/ui/Switch'
import { formatCurrency, formatPoints } from '@/lib/format'
import { today } from '@/lib/date'

export function IcvPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(today(), periods)
  const { metrics, loading: metricsLoading, error: metricsError } = usePeriodMetrics(currentPeriod)
  const { profile, loading: profileLoading, setShowIcv } = useProfile()
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function handleToggle(value: boolean) {
    setToggleError(null)
    const result = await setShowIcv(value)
    if (result.error) setToggleError(result.error)
  }

  const loading = periodsLoading || metricsLoading || profileLoading

  if (loading) return <p className="text-sm text-slate-500">Calculando ICV…</p>
  if (periodsError || metricsError) return <p className="text-sm text-red-600">{periodsError ?? metricsError}</p>
  if (!currentPeriod) return <NoPeriodNotice message="Configura un período para calcular el ICV." latestPeriod={periods[0]} />
  if (!metrics) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <SwitchField
            checked={profile?.showIcv ?? false}
            onChange={handleToggle}
            disabled={profileLoading}
            label="Mostrar ICV en el Dashboard"
            description="Controla si el Factor ICV se aplica al Incentivo Final. El % ICV en sí se calcula solo, abajo, no depende de este interruptor."
          />
          {toggleError && <p className="mt-2 text-xs text-red-600">No se pudo guardar: {toggleError}</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recaudado S/</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(metrics.icvRecaudado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Por cobrar S/</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(metrics.icvPorCobrar)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ICV — {currentPeriod.name}</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">
              {metrics.icvPercentage != null ? formatPoints(metrics.icvPercentage) : 'Sin datos'}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factor ICV</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-3xl font-semibold text-slate-900">{metrics.icvFactor != null ? metrics.icvFactor.toFixed(2) : '—'}</p>
          {metrics.icvPercentage != null && metrics.icvFactor == null && (
            <p className="mt-1 text-xs text-amber-600">El % ICV no cae en ningún tramo configurado.</p>
          )}
        </CardBody>
      </Card>

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
              {currentPeriod.icvFactorRules.map((rule) => {
                const active =
                  metrics.icvPercentage != null && metrics.icvPercentage >= rule.min && (rule.max === null || metrics.icvPercentage <= rule.max)
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

      <p className="text-xs text-slate-400">
        El ICV se calcula solo, igual que Interseguro: Recaudado ÷ Por cobrar de las cuotas de tus pólizas activas, más las pólizas
        anuladas dentro de su primer año desde la Fecha de Emisión.
      </p>
    </div>
  )
}
