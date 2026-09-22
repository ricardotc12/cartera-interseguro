import { usePayments, type PaymentWithContext } from '@/hooks/usePayments'
import { calculateDaysOverdue, effectiveDueDate, PENDING_WINDOW_DAYS } from '@/domain'
import { today } from '@/lib/date'

/** Mismo horizonte que el estado "Pendiente" del pago: recién avisa "por vencer" desde un día antes del cobro. */
const UPCOMING_WINDOW_DAYS = PENDING_WINDOW_DAYS

export interface CollectionAlert {
  payment: PaymentWithContext
  dueDate: string
}

function daysUntilDue(dueDate: string, referenceDate: string): number {
  return Math.floor((new Date(dueDate).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

/** Pagos vencidos y por vencer, para la campana y el modal de alertas del Dashboard (misma fuente, un solo cálculo). */
export function useCollectionAlerts() {
  const { payments, loading } = usePayments()

  const unpaid: CollectionAlert[] = payments
    .filter((p) => p.status === 'no_pagado' || p.status === 'pendiente_confirmar')
    .map((p) => ({ payment: p, dueDate: effectiveDueDate(p.yearMonth, p.dueDate) }))

  const overdue = unpaid
    .filter(({ dueDate }) => calculateDaysOverdue(dueDate, today()) != null)
    .sort((a, b) => (calculateDaysOverdue(b.dueDate, today()) ?? 0) - (calculateDaysOverdue(a.dueDate, today()) ?? 0))

  const upcoming = unpaid
    .filter(({ dueDate }) => calculateDaysOverdue(dueDate, today()) == null && daysUntilDue(dueDate, today()) <= UPCOMING_WINDOW_DAYS)
    .sort((a, b) => daysUntilDue(a.dueDate, today()) - daysUntilDue(b.dueDate, today()))

  return { overdue, upcoming, total: overdue.length + upcoming.length, loading, daysUntilDue }
}
