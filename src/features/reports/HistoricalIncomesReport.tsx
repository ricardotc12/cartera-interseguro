import { useState, type FormEvent } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useHistoricalIncomes, type HistoricalIncomeInput } from '@/hooks/useHistoricalIncomes'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { usePeriodsReport } from '@/hooks/usePeriodsReport'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FormField, fieldClass } from '@/components/ui/FormField'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { today } from '@/lib/date'
import type { HistoricalIncome } from '@/types/domain'

const MANUAL_COLOR = '#94a3b8' // gris: mes registrado a mano
const PERIOD_COLOR = '#009ed1' // celeste: calculado en vivo por período

interface IncomeChartPoint {
  date: string
  label: string
  amount: number
  source: 'manual' | 'period'
}

const currentMonth = () => `${today().slice(0, 7)}-01`

function toMonthInputValue(yearMonth: string): string {
  return yearMonth.slice(0, 7)
}

export function HistoricalIncomesReport() {
  const { incomes, loading, error, createIncome, updateIncome, deleteIncome } = useHistoricalIncomes()
  const { periods, loading: periodsLoading } = usePeriodsAdmin()
  const { rows: periodRows, loading: periodsReportLoading } = usePeriodsReport(periods)

  const [editing, setEditing] = useState<HistoricalIncome | undefined>(undefined)
  const [month, setMonth] = useState(toMonthInputValue(currentMonth()))
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<HistoricalIncome | undefined>(undefined)

  function startEdit(income: HistoricalIncome) {
    setEditing(income)
    setMonth(toMonthInputValue(income.yearMonth))
    setAmount(String(income.amount))
    setNotes(income.notes ?? '')
    setFieldErrors({})
    setSubmitError(null)
  }

  function resetForm() {
    setEditing(undefined)
    setMonth(toMonthInputValue(currentMonth()))
    setAmount('')
    setNotes('')
    setFieldErrors({})
    setSubmitError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const errors: Record<string, string> = {}
    if (!month) errors.month = 'Selecciona el mes.'
    const amountValue = Number(amount)
    if (!amount || !Number.isFinite(amountValue) || amountValue < 0) errors.amount = 'Ingresa un monto válido.'
    const yearMonth = `${month}-01`
    if (!editing && incomes.some((i) => i.yearMonth === yearMonth)) {
      errors.month = 'Ya registraste un monto para ese mes. Edítalo en vez de crear otro.'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const input: HistoricalIncomeInput = { yearMonth, amount: amountValue, notes: notes.trim() || null }
    setSubmitting(true)
    const result = editing ? await updateIncome(editing.id, input) : await createIncome(input)
    setSubmitting(false)

    if (result.error) {
      setSubmitError(result.error)
      return
    }
    resetForm()
  }

  const manualPoints: IncomeChartPoint[] = incomes.map((i) => ({
    date: i.yearMonth,
    label: formatMonthYear(i.yearMonth),
    amount: i.amount,
    source: 'manual',
  }))

  // Del período calculado en vivo se usa el Incentivo Final si ya está confirmado
  // (Factor Cobranza/ICV activos); si no, el Incentivo Base — el mismo criterio que
  // ya usa el Dashboard para no mostrar un monto que dependa de un factor sin confirmar.
  const periodPoints: IncomeChartPoint[] = periodRows
    .map((r): IncomeChartPoint | null => {
      const amount = r.finalIncentive ?? r.baseIncentive
      return amount != null ? { date: r.startDate, label: r.name, amount, source: 'period' } : null
    })
    .filter((p): p is IncomeChartPoint => p != null)

  const chartData = [...manualPoints, ...periodPoints].sort((a, b) => a.date.localeCompare(b.date))
  const chartLoading = loading || periodsLoading || periodsReportLoading

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{editing ? `Editar ${formatMonthYear(editing.yearMonth)}` : 'Registrar un mes ya pagado'}</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Mes" htmlFor="month" error={fieldErrors.month}>
                <input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={fieldClass(!!fieldErrors.month)}
                />
              </FormField>
              <FormField label="Monto recibido (S/)" htmlFor="amount" error={fieldErrors.amount}>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={fieldClass(!!fieldErrors.amount)}
                />
              </FormField>
            </div>
            <FormField label="Notas" htmlFor="notes" hint="Opcional">
              <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass()} />
            </FormField>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <div className="flex justify-end gap-2">
              {editing && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={submitting}>
                <Plus className="h-4 w-4" />
                {submitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar mes'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {!chartLoading && chartData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución de ingresos</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={80} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      formatCurrency(value),
                      item.payload.source === 'manual' ? 'Registrado a mano' : 'Calculado por período',
                    ]}
                  />
                  <Bar dataKey="amount" name="Ingreso" radius={[4, 4, 0, 0]}>
                    {chartData.map((point, index) => (
                      <Cell key={index} fill={point.source === 'manual' ? MANUAL_COLOR : PERIOD_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: MANUAL_COLOR }} />
                Registrado a mano (meses ya pagados antes de usar períodos)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PERIOD_COLOR }} />
                Calculado automáticamente por período
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : incomes.length === 0 ? (
        <Card>
          <CardBody className="py-8 text-center text-sm text-slate-400">Aún no has registrado meses pasados.</CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Mes</th>
                  <th className="px-4 py-2 font-medium">Monto</th>
                  <th className="px-4 py-2 font-medium">Notas</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">{formatMonthYear(income.yearMonth)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatCurrency(income.amount)}</td>
                    <td className="px-4 py-2 text-slate-500">{income.notes ?? '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(income)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar" aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(income)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar" aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          title="Eliminar registro"
          description={`Se eliminará el monto registrado para ${formatMonthYear(deleting.yearMonth)}. Esta acción no se puede deshacer.`}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => deleteIncome(deleting.id)}
        />
      )}
    </div>
  )
}
