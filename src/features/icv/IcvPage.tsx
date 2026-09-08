import { useState, type FormEvent } from 'react'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { useIcvRecords } from '@/hooks/useIcvRecords'
import { useProfile } from '@/hooks/useProfile'
import { calculatePeriodForDate, calculateICVFactor } from '@/domain'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { NoPeriodNotice } from '@/components/ui/NoPeriodNotice'
import { SwitchField } from '@/components/ui/Switch'
import { formatPoints } from '@/lib/format'
import { today } from '@/lib/date'

export function IcvPage() {
  const { periods, loading: periodsLoading, error: periodsError } = usePeriodsAdmin()
  const currentPeriod = calculatePeriodForDate(today(), periods)
  const { getForPeriod, setIcvForPeriod, loading: icvLoading } = useIcvRecords()
  const { profile, loading: profileLoading, setShowIcv } = useProfile()

  const record = currentPeriod ? getForPeriod(currentPeriod.id) : null
  const [editing, setEditing] = useState(false)
  const [icvValue, setIcvValue] = useState(record?.icvPercentage != null ? String(record.icvPercentage) : '')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function handleToggle(value: boolean) {
    setToggleError(null)
    const result = await setShowIcv(value)
    if (result.error) setToggleError(result.error)
  }

  const loading = periodsLoading || icvLoading

  if (loading) return <p className="text-sm text-slate-500">Cargando ICV…</p>
  if (periodsError) return <p className="text-sm text-red-600">{periodsError}</p>
  if (!currentPeriod) return <NoPeriodNotice message="Configura un período para registrar el % ICV." latestPeriod={periods[0]} />

  const icvFactor = record ? calculateICVFactor(record.icvPercentage, currentPeriod.icvFactorRules) : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(icvValue)
    if (!icvValue || !Number.isFinite(value) || value < 0) {
      setError('Ingresa un % ICV válido.')
      return
    }
    setSubmitting(true)
    const result = await setIcvForPeriod(currentPeriod!.id, value, notes.trim() || null)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <SwitchField
            checked={profile?.showIcv ?? false}
            onChange={handleToggle}
            disabled={profileLoading}
            label="Mostrar ICV en el Dashboard"
            description="Actívalo cuando confirmes con Interseguro la fórmula oficial de cálculo. Mientras tanto queda oculto del Dashboard, pero se sigue calculando aquí y en el Incentivo Final."
          />
          {toggleError && <p className="mt-2 text-xs text-red-600">No se pudo guardar: {toggleError}</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>% ICV — {currentPeriod.name}</CardTitle>
          </CardHeader>
          <CardBody>
            {editing || !record ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <FormField label="% ICV" htmlFor="icvValue" error={error ?? undefined}>
                  <input
                    id="icvValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={icvValue}
                    onChange={(e) => setIcvValue(e.target.value)}
                    className={fieldClass(!!error)}
                  />
                </FormField>
                <FormField label="Notas" htmlFor="notes" hint="Opcional">
                  <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass()} />
                </FormField>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? 'Guardando…' : 'Guardar'}
                  </Button>
                  {record && (
                    <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <div>
                <p className="text-3xl font-semibold text-slate-900">{formatPoints(record.icvPercentage)}</p>
                {record.notes && <p className="mt-1 text-sm text-slate-500">{record.notes}</p>}
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factor ICV</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{icvFactor != null ? icvFactor.toFixed(2) : '—'}</p>
            {record && icvFactor == null && <p className="mt-1 text-xs text-amber-600">El % ICV no cae en ningún tramo configurado.</p>}
            {!record && <p className="mt-1 text-xs text-slate-400">Registra el % ICV para calcular el factor.</p>}
          </CardBody>
        </Card>
      </div>

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
                const active = record != null && record.icvPercentage >= rule.min && (rule.max === null || record.icvPercentage <= rule.max)
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
        La fórmula exacta con la que Interseguro calcula el % ICV aún no ha sido proporcionada; por eso se registra manualmente.
      </p>
    </div>
  )
}
