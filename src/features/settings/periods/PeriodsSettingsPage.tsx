import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Copy, History, Play, Lock, Trash2, ArrowLeft } from 'lucide-react'
import { usePeriodsAdmin, type PeriodWithRules } from '@/hooks/usePeriodsAdmin'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, formatCurrency, formatPercentage } from '@/lib/format'
import { PeriodFormPage } from './PeriodFormPage'
import { AuditLogPanel } from './AuditLogPanel'

type View = { kind: 'list' } | { kind: 'history' } | { kind: 'create'; source?: PeriodWithRules } | { kind: 'edit'; period: PeriodWithRules } | { kind: 'view'; period: PeriodWithRules }

const STATUS_TONE: Record<string, 'success' | 'neutral' | 'warning'> = { active: 'success', draft: 'warning', closed: 'neutral' }
const STATUS_LABEL: Record<string, string> = { active: 'Activo', draft: 'Borrador', closed: 'Cerrado' }

export function PeriodsSettingsPage() {
  const { periods, loading, error, createPeriod, updatePeriod, setPeriodStatus, deletePeriod } = usePeriodsAdmin()
  const [view, setView] = useState<View>({ kind: 'list' })
  const [deleting, setDeleting] = useState<PeriodWithRules | undefined>(undefined)
  const location = useLocation()
  const navigate = useNavigate()
  const consumedShortcut = useRef(false)

  const latestPeriod = periods[0]

  // Atajo desde el aviso "período por finalizar" / "sin período configurado": salta
  // directo al formulario de creación con ese período como base, en vez de dejar
  // que la asesora tenga que encontrar y hacer clic en "Nuevo período" ella misma.
  useEffect(() => {
    const createFromPeriodId = (location.state as { createFromPeriodId?: string } | null)?.createFromPeriodId
    if (!createFromPeriodId || consumedShortcut.current || loading) return
    const source = periods.find((p) => p.id === createFromPeriodId)
    if (!source) return
    consumedShortcut.current = true
    setView({ kind: 'create', source })
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, periods, loading, navigate])

  if (view.kind === 'create' || view.kind === 'edit' || view.kind === 'view') {
    const mode = view.kind
    return (
      <div className="space-y-4">
        <button onClick={() => setView({ kind: 'list' })} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Volver a períodos
        </button>
        <PeriodFormPage
          mode={mode}
          sourcePeriod={view.kind === 'create' ? view.source : undefined}
          editingPeriod={view.kind !== 'create' ? view.period : undefined}
          onCancel={() => setView({ kind: 'list' })}
          onSubmit={(period, rules) =>
            view.kind === 'edit' ? updatePeriod(view.period.id, period, rules) : createPeriod(period, rules)
          }
        />
      </div>
    )
  }

  if (view.kind === 'history') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView({ kind: 'list' })} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Volver a períodos
        </button>
        <h2 className="text-sm font-semibold text-slate-700">Historial de cambios en reglas y períodos</h2>
        <AuditLogPanel />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setView({ kind: 'history' })}>
          <History className="h-4 w-4" />
          Historial
        </Button>
        <Button onClick={() => setView({ kind: 'create', source: latestPeriod })}>
          <Plus className="h-4 w-4" />
          Nuevo período
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando períodos…</p>
      ) : periods.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-500">
            Aún no has configurado ningún período de incentivo. Crea el primero para empezar a calcular tus incentivos.
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Período</th>
                  <th className="px-4 py-3 font-medium">Fecha inicio</th>
                  <th className="px-4 py-3 font-medium">Fecha fin</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Meta</th>
                  <th className="px-4 py-3 font-medium">% máx. incentivo</th>
                  <th className="px-4 py-3 font-medium">Factor ICV máx.</th>
                  <th className="px-4 py-3 font-medium">Factor Cobranza máx.</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{period.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(period.startDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(period.endDate)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[period.status]} dot>{STATUS_LABEL[period.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(period.vidaEmissionGoal)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {period.maxIncentivePercentage != null ? formatPercentage(period.maxIncentivePercentage, 0) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{period.maxIcvFactor != null ? period.maxIcvFactor.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {period.maxCollectionFactor != null ? period.maxCollectionFactor.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setView({ kind: 'view', period })}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Ver detalle" aria-label="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {period.status !== 'closed' && (
                          <button
                            onClick={() => setView({ kind: 'edit', period })}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Editar" aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setView({ kind: 'create', source: period })}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Duplicar" aria-label="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        {period.status === 'draft' && (
                          <button
                            onClick={() => setPeriodStatus(period.id, 'active')}
                            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50"
                            title="Activar" aria-label="Activar"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {period.status === 'active' && (
                          <button
                            onClick={() => setPeriodStatus(period.id, 'closed')}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Cerrar período" aria-label="Cerrar período"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        )}
                        {period.status === 'draft' && (
                          <button
                            onClick={() => setDeleting(period)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar" aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          title="Eliminar período"
          description={`Se eliminará el período "${deleting.name}" y todas sus reglas. Esta acción no se puede deshacer.`}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => deletePeriod(deleting.id)}
        />
      )}
    </div>
  )
}
