import { useMemo, useState } from 'react'
import { Search, Phone, MessageCircle, Mail, Wallet, ChevronRight } from 'lucide-react'
import { usePayments, type PaymentWithContext, type PaymentUpdateInput } from '@/hooks/usePayments'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { fieldClass } from '@/components/ui/FormField'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { today } from '@/lib/date'
import { calculateDaysOverdue, effectiveDueDate, getDisplayPaymentStatus } from '@/domain'
import type { Affiliate, PaymentStatus } from '@/types/domain'
import { PaymentFormModal } from './PaymentFormModal'
import { PaymentHistoryModal } from './PaymentHistoryModal'

type StatusFilter = 'pendientes' | PaymentStatus | 'todos'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'todos', label: 'Todos los estados' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'no_pagado', label: 'No pagado' },
  { value: 'pendiente_confirmar', label: 'Pendiente de confirmar' },
  { value: 'no_corresponde', label: 'No corresponde' },
]

const currentMonth = () => `${today().slice(0, 7)}-01`

function matchesSearch(payment: PaymentWithContext, query: string): boolean {
  if (!query) return true
  const haystack = `${payment.affiliate.firstName} ${payment.affiliate.lastName} ${payment.affiliate.dni} ${payment.policy.policyNumber}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

interface AffiliateSummary {
  affiliate: Affiliate
  policyNumbers: string[]
  pendingCount: number
  paidCount: number
  totalPending: number
  maxOverdue: number | null
}

/** Agrupa los pagos filtrados por afiliado: cada persona aparece una sola vez en la lista (sección "un afiliado, un click, todos sus meses"). */
function groupByAffiliate(items: PaymentWithContext[]): AffiliateSummary[] {
  const byId = new Map<string, AffiliateSummary>()

  for (const payment of items) {
    const id = payment.affiliate.id
    let summary = byId.get(id)
    if (!summary) {
      summary = { affiliate: payment.affiliate, policyNumbers: [], pendingCount: 0, paidCount: 0, totalPending: 0, maxOverdue: null }
      byId.set(id, summary)
    }
    if (!summary.policyNumbers.includes(payment.policy.policyNumber)) summary.policyNumbers.push(payment.policy.policyNumber)

    if (payment.status === 'pagado') {
      summary.paidCount += 1
    } else if (payment.status === 'no_pagado' || payment.status === 'pendiente_confirmar') {
      const dueDate = effectiveDueDate(payment.yearMonth, payment.dueDate)
      // Un mes recién generado ya es 'no_pagado' en base de datos desde el día 1, pero no
      // corresponde contarlo como pendiente en el resumen del afiliado hasta que realmente
      // entre en su ventana de cobro (sección "Al día"/"Pendiente"/"No pagado").
      const displayStatus = getDisplayPaymentStatus(payment.status, dueDate, today())
      if (displayStatus !== 'al_dia') {
        summary.pendingCount += 1
        summary.totalPending += payment.expectedAmount
        const overdue = calculateDaysOverdue(dueDate, today())
        if (overdue != null && (summary.maxOverdue == null || overdue > summary.maxOverdue)) summary.maxOverdue = overdue
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount
    if ((b.maxOverdue ?? -1) !== (a.maxOverdue ?? -1)) return (b.maxOverdue ?? -1) - (a.maxOverdue ?? -1)
    return `${a.affiliate.lastName} ${a.affiliate.firstName}`.localeCompare(`${b.affiliate.lastName} ${b.affiliate.firstName}`)
  })
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

  const summaries = useMemo(() => groupByAffiliate(filtered), [filtered])

  const historyPayments = historyFor ? payments.filter((p) => p.affiliate.id === historyFor.id) : []

  async function handleUpdate(id: string, input: PaymentUpdateInput) {
    return updatePayment(id, input)
  }

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
          <TableRowsSkeleton rows={6} columns={5} />
        </Card>
      ) : summaries.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center text-sm text-slate-500">
            <Wallet className="mb-3 h-8 w-8 text-slate-300" />
            {payments.length === 0
              ? 'Aún no hay pólizas activas con meses de cobranza generados.'
              : 'Ningún afiliado coincide con los filtros seleccionados.'}
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Desktop: tabla, un afiliado por fila */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Afiliado</th>
                  <th className="px-4 py-3 font-medium">Póliza(s)</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Monto pendiente</th>
                  <th className="px-4 py-3 font-medium">Atraso</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((summary) => (
                  <tr
                    key={summary.affiliate.id}
                    onClick={() => setHistoryFor(summary.affiliate)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {summary.affiliate.firstName} {summary.affiliate.lastName}
                      <div className="text-xs font-normal text-slate-400">DNI {summary.affiliate.dni}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{summary.policyNumbers.join(', ')}</td>
                    <td className="px-4 py-3">
                      {summary.pendingCount > 0 ? (
                        <Badge tone={summary.maxOverdue ? 'danger' : 'warning'} dot>
                          {summary.pendingCount} pendiente{summary.pendingCount === 1 ? '' : 's'}
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          Al día
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {summary.totalPending > 0 ? formatCurrency(summary.totalPending) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {summary.maxOverdue ? <span className="text-xs font-medium text-red-600">{summary.maxOverdue} días</span> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {summary.affiliate.phone && (
                          <>
                            <a
                              href={`tel:${summary.affiliate.phone}`}
                              className="rounded p-1.5 text-blue-500 hover:bg-blue-50"
                              title="Llamar" aria-label="Llamar"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                            <a
                              href={`https://wa.me/${summary.affiliate.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50"
                              title="WhatsApp" aria-label="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        {summary.affiliate.email && (
                          <a
                            href={`mailto:${summary.affiliate.email}`}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Correo" aria-label="Correo"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setHistoryFor(summary.affiliate)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Ver meses" aria-label="Ver meses"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Móvil: cards, un afiliado por tarjeta */}
          <div className="space-y-3 md:hidden">
            {summaries.map((summary) => (
              <Card
                key={summary.affiliate.id}
                onClick={() => setHistoryFor(summary.affiliate)}
                className="cursor-pointer active:bg-slate-50"
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {summary.affiliate.firstName} {summary.affiliate.lastName}
                      </p>
                      <p className="text-xs text-slate-500">DNI {summary.affiliate.dni} · Póliza {summary.policyNumbers.join(', ')}</p>
                    </div>
                    {summary.pendingCount > 0 ? (
                      <Badge tone={summary.maxOverdue ? 'danger' : 'warning'} dot>
                        {summary.pendingCount} pendiente{summary.pendingCount === 1 ? '' : 's'}
                      </Badge>
                    ) : (
                      <Badge tone="success" dot>
                        Al día
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {summary.totalPending > 0 ? formatCurrency(summary.totalPending) : 'Sin monto pendiente'}
                    </span>
                    {summary.maxOverdue && <span className="text-xs font-medium text-red-600">{summary.maxOverdue} días de atraso</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {summary.affiliate.phone && (
                        <>
                          <a href={`tel:${summary.affiliate.phone}`} className="rounded p-2 text-blue-500 hover:bg-blue-50" title="Llamar" aria-label="Llamar">
                            <Phone className="h-4 w-4" />
                          </a>
                          <a
                            href={`https://wa.me/${summary.affiliate.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded p-2 text-emerald-500 hover:bg-emerald-50"
                            title="WhatsApp" aria-label="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      {summary.affiliate.email && (
                        <a href={`mailto:${summary.affiliate.email}`} className="rounded p-2 text-red-500 hover:bg-red-50" title="Correo" aria-label="Correo">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-700">
                      Ver meses
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {registering && (
        <PaymentFormModal
          open={!!registering}
          payment={registering}
          initial={{ status: 'pagado', paidAmount: registering.expectedAmount, paymentDate: today() }}
          onClose={() => setRegistering(undefined)}
          onSubmit={(input) => handleUpdate(registering.id, input)}
        />
      )}

      {editing && (
        <PaymentFormModal
          open={!!editing}
          payment={editing}
          onClose={() => setEditing(undefined)}
          onSubmit={(input) => handleUpdate(editing.id, input)}
        />
      )}

      {historyFor && (
        <PaymentHistoryModal
          open={!!historyFor}
          affiliate={historyFor}
          payments={historyPayments}
          onClose={() => setHistoryFor(undefined)}
          onRegisterPayment={(payment) => setRegistering(payment)}
          onEditPayment={(payment) => setEditing(payment)}
        />
      )}
    </div>
  )
}
