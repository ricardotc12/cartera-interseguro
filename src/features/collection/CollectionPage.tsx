import { useMemo, useState } from 'react'
import { Search, CheckCircle2, Pencil, Phone, MessageCircle, Mail, Wallet } from 'lucide-react'
import { usePayments, type PaymentWithContext } from '@/hooks/usePayments'
import { Card, CardBody } from '@/components/ui/Card'
import { fieldClass } from '@/components/ui/FormField'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { calculateDaysOverdue } from '@/domain'
import type { PaymentStatus } from '@/types/domain'
import { PaymentStatusBadge } from './PaymentStatusBadge'
import { PaymentFormModal } from './PaymentFormModal'
import { PaymentHistoryModal } from './PaymentHistoryModal'
import type { Affiliate } from '@/types/domain'

type StatusFilter = 'pendientes' | PaymentStatus | 'todos'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'todos', label: 'Todos los estados' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'no_pagado', label: 'No pagado' },
  { value: 'pendiente_confirmar', label: 'Pendiente de confirmar' },
  { value: 'no_corresponde', label: 'No corresponde' },
]

const today = () => new Date().toISOString().slice(0, 10)
const currentMonth = () => `${today().slice(0, 7)}-01`

function daysOverdue(payment: PaymentWithContext): number | null {
  if (payment.status !== 'no_pagado' && payment.status !== 'pendiente_confirmar') return null
  return calculateDaysOverdue(payment.dueDate, today())
}

function matchesSearch(payment: PaymentWithContext, query: string): boolean {
  if (!query) return true
  const haystack = `${payment.affiliate.firstName} ${payment.affiliate.lastName} ${payment.affiliate.dni} ${payment.policy.policyNumber}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function CollectionPage() {
  const { payments, loading, error, updatePayment } = usePayments()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendientes')
  const [monthFilter, setMonthFilter] = useState<string>(currentMonth())
  const [registering, setRegistering] = useState<PaymentWithContext | undefined>(undefined)
  const [editing, setEditing] = useState<PaymentWithContext | undefined>(undefined)
  const [historyFor, setHistoryFor] = useState<Affiliate | undefined>(undefined)

  const availableMonths = useMemo(() => {
    const months = new Set(payments.map((p) => p.yearMonth))
    months.add(currentMonth())
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [payments])

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        if (monthFilter !== 'todos' && p.yearMonth !== monthFilter) return false
        if (statusFilter === 'pendientes' && !['no_pagado', 'pendiente_confirmar'].includes(p.status)) return false
        if (statusFilter !== 'pendientes' && statusFilter !== 'todos' && p.status !== statusFilter) return false
        return matchesSearch(p, search)
      }),
    [payments, search, statusFilter, monthFilter],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por afiliado, DNI o póliza…"
            className={`${fieldClass()} pl-9`}
          />
        </div>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={`${fieldClass()} sm:w-44`}>
          <option value="todos">Todos los meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthYear(m)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className={`${fieldClass()} sm:w-52`}
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {loading ? (
        <Card className="overflow-hidden">
          <TableRowsSkeleton rows={6} columns={6} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center text-sm text-slate-500">
            <Wallet className="mb-3 h-8 w-8 text-slate-300" />
            {payments.length === 0
              ? 'Aún no hay pólizas activas con meses de cobranza generados.'
              : 'Ningún pago coincide con los filtros seleccionados.'}
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Desktop: tabla */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Afiliado</th>
                  <th className="px-4 py-3 font-medium">Póliza</th>
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium">Monto esperado</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Atraso</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment) => {
                  const overdue = daysOverdue(payment)
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => setHistoryFor(payment.affiliate)}
                          className="text-left hover:text-primary-700 hover:underline"
                          title="Ver historial de pagos"
                        >
                          {payment.affiliate.firstName} {payment.affiliate.lastName}
                        </button>
                        <div className="text-xs font-normal text-slate-400">DNI {payment.affiliate.dni}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{payment.policy.policyNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{formatMonthYear(payment.yearMonth)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(payment.expectedAmount)}</td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                      <td className="px-4 py-3">
                        {overdue ? <span className="text-xs font-medium text-red-600">{overdue} días</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {payment.affiliate.phone && (
                            <>
                              <a
                                href={`tel:${payment.affiliate.phone}`}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="Llamar" aria-label="Llamar"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                              <a
                                href={`https://wa.me/${payment.affiliate.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                title="WhatsApp" aria-label="WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                            </>
                          )}
                          {payment.affiliate.email && (
                            <a
                              href={`mailto:${payment.affiliate.email}`}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="Correo" aria-label="Correo"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                          {payment.status !== 'pagado' && (
                            <button
                              onClick={() => setRegistering(payment)}
                              className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50"
                              title="Registrar pago" aria-label="Registrar pago"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditing(payment)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Editar" aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {/* Móvil: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((payment) => {
              const overdue = daysOverdue(payment)
              return (
                <Card key={payment.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setHistoryFor(payment.affiliate)}
                          className="text-left font-medium text-slate-900 hover:text-primary-700 hover:underline"
                          title="Ver historial de pagos"
                        >
                          {payment.affiliate.firstName} {payment.affiliate.lastName}
                        </button>
                        <p className="text-xs text-slate-500">
                          Póliza {payment.policy.policyNumber} · {formatMonthYear(payment.yearMonth)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{formatCurrency(payment.expectedAmount)}</span>
                      {overdue && <span className="text-xs font-medium text-red-600">{overdue} días de atraso</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <div className="flex gap-1">
                        {payment.affiliate.phone && (
                          <>
                            <a href={`tel:${payment.affiliate.phone}`} className="rounded p-2 text-slate-400 hover:bg-slate-100" title="Llamar" aria-label="Llamar">
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={`https://wa.me/${payment.affiliate.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-2 text-slate-400 hover:bg-slate-100"
                              title="WhatsApp" aria-label="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        {payment.affiliate.email && (
                          <a href={`mailto:${payment.affiliate.email}`} className="rounded p-2 text-slate-400 hover:bg-slate-100" title="Correo" aria-label="Correo">
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {payment.status !== 'pagado' && (
                          <button
                            onClick={() => setRegistering(payment)}
                            className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Registrar pago
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(payment)}
                          className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {registering && (
        <PaymentFormModal
          open={!!registering}
          payment={registering}
          initial={{ status: 'pagado', paidAmount: registering.expectedAmount, paymentDate: today() }}
          onClose={() => setRegistering(undefined)}
          onSubmit={(input) => updatePayment(registering.id, input)}
        />
      )}

      {editing && (
        <PaymentFormModal
          open={!!editing}
          payment={editing}
          onClose={() => setEditing(undefined)}
          onSubmit={(input) => updatePayment(editing.id, input)}
        />
      )}

      {historyFor && (
        <PaymentHistoryModal
          open={!!historyFor}
          affiliate={historyFor}
          payments={payments.filter((p) => p.affiliate.id === historyFor.id)}
          onClose={() => setHistoryFor(undefined)}
        />
      )}
    </div>
  )
}
