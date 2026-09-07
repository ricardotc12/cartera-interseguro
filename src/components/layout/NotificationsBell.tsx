import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { usePayments, type PaymentWithContext } from '@/hooks/usePayments'
import { calculateDaysOverdue } from '@/domain'
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/format'

/** Días de anticipación para avisar de un pago "por vencer" (mismo horizonte que el aviso de fin de período). */
const UPCOMING_WINDOW_DAYS = 5

const today = () => new Date().toISOString().slice(0, 10)

function daysUntilDue(dueDate: string, referenceDate: string): number {
  return Math.floor((new Date(dueDate).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

function AlertRow({ payment, tone, text }: { payment: PaymentWithContext; tone: 'danger' | 'warning'; text: string }) {
  return (
    <li>
      <Link to="/cobranza" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
        <p className="text-sm font-medium text-slate-900">
          {payment.affiliate.firstName} {payment.affiliate.lastName}
        </p>
        <p className={`text-xs ${tone === 'danger' ? 'text-red-600' : 'text-amber-600'}`}>
          {formatMonthYear(payment.yearMonth)} · {text} · {formatCurrency(payment.expectedAmount)}
        </p>
      </Link>
    </li>
  )
}

export function NotificationsBell() {
  const { payments, loading } = usePayments()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  if (loading) return null

  const unpaid = payments.filter((p) => (p.status === 'no_pagado' || p.status === 'pendiente_confirmar') && p.dueDate)

  const overdue = unpaid
    .filter((p) => calculateDaysOverdue(p.dueDate, today()) != null)
    .sort((a, b) => (calculateDaysOverdue(b.dueDate, today()) ?? 0) - (calculateDaysOverdue(a.dueDate, today()) ?? 0))

  const upcoming = unpaid
    .filter((p) => calculateDaysOverdue(p.dueDate, today()) == null && daysUntilDue(p.dueDate!, today()) <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => daysUntilDue(a.dueDate!, today()) - daysUntilDue(b.dueDate!, today()))

  const total = overdue.length + upcoming.length

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-white/90 hover:bg-white/10"
        title="Alertas de cobranza"
        aria-label="Alertas de cobranza"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Alertas de cobranza</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {total === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">No tienes pagos por vencer ni vencidos.</p>
            ) : (
              <>
                {overdue.length > 0 && (
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">Pagos vencidos</p>
                    <ul className="space-y-0.5">
                      {overdue.map((p) => (
                        <AlertRow key={p.id} payment={p} tone="danger" text={`${calculateDaysOverdue(p.dueDate, today())} días de atraso`} />
                      ))}
                    </ul>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div>
                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600">Por vencer</p>
                    <ul className="space-y-0.5">
                      {upcoming.map((p) => {
                        const days = daysUntilDue(p.dueDate!, today())
                        return (
                          <AlertRow
                            key={p.id}
                            payment={p}
                            tone="warning"
                            text={days === 0 ? `vence hoy (${formatDate(p.dueDate!)})` : `vence en ${days} día${days === 1 ? '' : 's'}`}
                          />
                        )
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
