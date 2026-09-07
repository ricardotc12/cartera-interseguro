import { Link } from 'react-router-dom'
import { Phone, MessageCircle, Mail } from 'lucide-react'
import type { PaymentWithContext } from '@/hooks/usePayments'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { calculateDaysOverdue, effectiveDueDate } from '@/domain'
import { formatCurrency, formatMonthYear } from '@/lib/format'

const today = () => new Date().toISOString().slice(0, 10)

/** De todos los meses pendientes de una póliza, el que realmente corresponde cobrar ahora es el más antiguo (el resto son meses futuros que aún no vencen). */
function oldestPendingPerPolicy(payments: PaymentWithContext[]): PaymentWithContext[] {
  const oldestByPolicy = new Map<string, PaymentWithContext>()
  for (const payment of payments) {
    const current = oldestByPolicy.get(payment.policyId)
    if (!current || payment.yearMonth < current.yearMonth) oldestByPolicy.set(payment.policyId, payment)
  }
  return Array.from(oldestByPolicy.values())
}

export function PendingPaymentsList({ payments }: { payments: PaymentWithContext[] }) {
  const pending = oldestPendingPerPolicy(payments.filter((p) => p.status === 'no_pagado' || p.status === 'pendiente_confirmar'))
    .sort(
      (a, b) =>
        (calculateDaysOverdue(effectiveDueDate(b.yearMonth, b.dueDate), today()) ?? -1) -
        (calculateDaysOverdue(effectiveDueDate(a.yearMonth, a.dueDate), today()) ?? -1),
    )
    .slice(0, 8)

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Pagos pendientes</CardTitle>
        <Link to="/cobranza" className="text-xs font-medium text-brand-600 hover:underline">
          Ver todos en Cobranza
        </Link>
      </CardHeader>
      <CardBody className="p-0">
        {pending.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No tienes pagos pendientes por ahora.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((payment) => {
              const overdue = calculateDaysOverdue(effectiveDueDate(payment.yearMonth, payment.dueDate), today())
              return (
                <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {payment.affiliate.firstName} {payment.affiliate.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      DNI {payment.affiliate.dni} · Póliza {payment.policy.policyNumber} · {formatMonthYear(payment.yearMonth)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{formatCurrency(payment.expectedAmount)}</p>
                      {overdue && <p className="text-xs font-medium text-red-600">{overdue} días de atraso</p>}
                    </div>
                    <div className="flex gap-1">
                      {payment.affiliate.phone && (
                        <>
                          <a href={`tel:${payment.affiliate.phone}`} className="rounded p-1.5 text-blue-500 hover:bg-blue-50" title="Llamar" aria-label="Llamar">
                            <Phone className="h-4 w-4" />
                          </a>
                          <a
                            href={`https://wa.me/${payment.affiliate.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50"
                            title="WhatsApp" aria-label="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      {payment.affiliate.email && (
                        <a href={`mailto:${payment.affiliate.email}`} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Correo" aria-label="Correo">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
