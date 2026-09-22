import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useCollectionAlerts, type CollectionAlert } from '@/hooks/useCollectionAlerts'
import { calculateDaysOverdue } from '@/domain'
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/format'
import { today } from '@/lib/date'

function AlertRow({ payment, tone, text }: { payment: CollectionAlert['payment']; tone: 'danger' | 'warning'; text: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {payment.affiliate.firstName} {payment.affiliate.lastName}
        </p>
        <p className="text-xs text-slate-500">{formatMonthYear(payment.yearMonth)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-xs font-medium ${tone === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>{text}</p>
        <p className="text-xs text-slate-500">{formatCurrency(payment.expectedAmount)}</p>
      </div>
    </li>
  )
}

/**
 * Además de la campana (que hay que abrir), un aviso superpuesto al entrar al Dashboard
 * para que los pagos vencidos/por vencer no dependan de que la asesora se acuerde de
 * revisar la campana. No se muestra a la vez que el aviso de "período por terminar"
 * (`suppressed`) para no superponer dos modales.
 */
export function CollectionAlertsModal({ suppressed }: { suppressed: boolean }) {
  const { overdue, upcoming, total, loading, daysUntilDue } = useCollectionAlerts()
  const [dismissed, setDismissed] = useState(false)

  if (loading || suppressed || total === 0 || dismissed) return null

  return (
    <Modal open onClose={() => setDismissed(true)} title="Alertas de cobranza">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-slate-700">
            Tienes {total} pago{total === 1 ? '' : 's'} {overdue.length > 0 && upcoming.length > 0 ? 'vencido(s) o por vencer' : overdue.length > 0 ? 'vencido(s)' : 'por vencer'}.
          </p>
        </div>

        <div className="max-h-80 space-y-4 overflow-y-auto">
          {overdue.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-600">Pagos vencidos</p>
              <ul className="space-y-1.5">
                {overdue.map(({ payment, dueDate }) => (
                  <AlertRow key={payment.id} payment={payment} tone="danger" text={`${calculateDaysOverdue(dueDate, today())} días de atraso`} />
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">Por vencer</p>
              <ul className="space-y-1.5">
                {upcoming.map(({ payment, dueDate }) => {
                  const days = daysUntilDue(dueDate, today())
                  return (
                    <AlertRow
                      key={payment.id}
                      payment={payment}
                      tone="warning"
                      text={days === 0 ? `vence hoy (${formatDate(dueDate)})` : `vence en ${days} día${days === 1 ? '' : 's'}`}
                    />
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDismissed(true)}>
            Cerrar
          </Button>
          <Link
            to="/cobranza"
            onClick={() => setDismissed(true)}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ir a Cobranza
          </Link>
        </div>
      </div>
    </Modal>
  )
}
