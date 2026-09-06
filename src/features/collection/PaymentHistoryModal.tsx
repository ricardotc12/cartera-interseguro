import { Modal } from '@/components/ui/Modal'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { formatCurrency, formatDate, formatMonthYear } from '@/lib/format'
import { calculateDaysOverdue } from '@/domain'
import type { PaymentWithContext } from '@/hooks/usePayments'
import type { Affiliate } from '@/types/domain'

interface PaymentHistoryModalProps {
  open: boolean
  onClose: () => void
  affiliate: Affiliate
  /** Todos los pagos (de cualquier póliza y mes) de este afiliado, sin filtrar por período. */
  payments: PaymentWithContext[]
}

const today = () => new Date().toISOString().slice(0, 10)

export function PaymentHistoryModal({ open, onClose, affiliate, payments }: PaymentHistoryModalProps) {
  const paidCount = payments.filter((p) => p.status === 'pagado').length
  const pendingCount = payments.filter((p) => p.status === 'no_pagado' || p.status === 'pendiente_confirmar').length

  const byPolicy = new Map<string, PaymentWithContext[]>()
  for (const payment of payments) {
    const key = payment.policy.id
    if (!byPolicy.has(key)) byPolicy.set(key, [])
    byPolicy.get(key)!.push(payment)
  }

  return (
    <Modal open={open} onClose={onClose} title={`Historial de pagos · ${affiliate.firstName} ${affiliate.lastName}`}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            <span className="font-semibold text-emerald-600">{paidCount}</span> pagado{paidCount === 1 ? '' : 's'}
          </span>
          <span>
            <span className="font-semibold text-amber-600">{pendingCount}</span> pendiente{pendingCount === 1 ? '' : 's'}
          </span>
        </div>

        {payments.length === 0 ? (
          <p className="text-sm text-slate-400">Este afiliado aún no tiene meses de cobranza generados.</p>
        ) : (
          Array.from(byPolicy.entries()).map(([policyId, items]) => {
            const sorted = items.slice().sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
            return (
              <div key={policyId}>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Póliza {sorted[0]!.policy.policyNumber}</h3>
                <ul className="space-y-2">
                  {sorted.map((payment) => {
                    const overdue = calculateDaysOverdue(payment.dueDate, today())
                    return (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{formatMonthYear(payment.yearMonth)}</p>
                          <p className="text-xs text-slate-500">
                            {payment.status === 'pagado' && payment.paymentDate
                              ? `Pagado el ${formatDate(payment.paymentDate)}`
                              : overdue
                                ? `${overdue} días de atraso`
                                : `Esperado ${formatCurrency(payment.expectedAmount)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <PaymentStatusBadge status={payment.status} />
                          <span className="text-xs font-medium text-slate-600">
                            {formatCurrency(payment.paidAmount ?? payment.expectedAmount)}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
