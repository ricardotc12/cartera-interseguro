import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useQuoteExpiryReminders, type QuoteExpiryReminder } from '@/hooks/useQuoteExpiryReminders'
import { formatDate } from '@/lib/format'

function ReminderRow({ reminder, tone, text }: { reminder: QuoteExpiryReminder; tone: 'danger' | 'warning'; text: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <p className="min-w-0 truncate text-sm font-medium text-slate-900">{reminder.contact.fullName}</p>
      <p className={`shrink-0 text-xs font-medium ${tone === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>{text}</p>
    </li>
  )
}

/**
 * Aviso superpuesto al entrar al Dashboard cuando hay cotizaciones enviadas con fecha de
 * vencimiento vencida o a 2 días de cumplirse, para poder renovarlas a tiempo y no perder
 * al cliente. No se muestra a la vez que los otros avisos del Dashboard (`suppressed`).
 */
export function QuoteExpiryRemindersModal({ suppressed }: { suppressed: boolean }) {
  const { overdue, upcoming, total, loading } = useQuoteExpiryReminders()
  const [dismissed, setDismissed] = useState(false)

  if (loading || suppressed || total === 0 || dismissed) return null

  return (
    <Modal open onClose={() => setDismissed(true)} title="Cotizaciones por vencer" size="alert">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-slate-700">
            Tienes {total} cotización{total === 1 ? '' : 'es'} {overdue.length > 0 && upcoming.length > 0 ? 'vencida(s) o por vencer' : overdue.length > 0 ? 'vencida(s)' : 'por vencer'}.
          </p>
        </div>

        <div className="max-h-80 space-y-4 overflow-y-auto">
          {overdue.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-600">Ya vencidas</p>
              <ul className="space-y-1.5">
                {overdue.map((r) => (
                  <ReminderRow
                    key={r.contact.id}
                    reminder={r}
                    tone="danger"
                    text={`${Math.abs(r.daysUntil)} día${Math.abs(r.daysUntil) === 1 ? '' : 's'} de vencida`}
                  />
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">Por vencer</p>
              <ul className="space-y-1.5">
                {upcoming.map((r) => (
                  <ReminderRow
                    key={r.contact.id}
                    reminder={r}
                    tone="warning"
                    text={
                      r.daysUntil === 0
                        ? `vence hoy (${formatDate(r.contact.quoteExpiryDate!)})`
                        : `vence en ${r.daysUntil} día${r.daysUntil === 1 ? '' : 's'} (${formatDate(r.contact.quoteExpiryDate!)})`
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDismissed(true)}>
            Cerrar
          </Button>
          <Link
            to="/contactos"
            onClick={() => setDismissed(true)}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ir a Contactos
          </Link>
        </div>
      </div>
    </Modal>
  )
}
