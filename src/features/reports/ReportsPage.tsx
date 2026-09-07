import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAffiliates } from '@/hooks/useAffiliates'
import { usePayments } from '@/hooks/usePayments'
import { usePeriodsAdmin } from '@/hooks/usePeriodsAdmin'
import { usePeriodsReport } from '@/hooks/usePeriodsReport'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { fieldClass } from '@/components/ui/FormField'
import { downloadCsv } from '@/lib/csv'
import { formatDate, formatIncentiveTierValue } from '@/lib/format'
import type { AffiliateStatus, PaymentStatus } from '@/types/domain'
import { HistoricalIncomesReport } from './HistoricalIncomesReport'

type ReportTab = 'afiliados' | 'cobranza' | 'periodos' | 'historial'

const REPORT_TABS: { value: ReportTab; label: string }[] = [
  { value: 'afiliados', label: 'Afiliados' },
  { value: 'cobranza', label: 'Cobranza y pendientes' },
  { value: 'periodos', label: 'Emisión Vida, Incentivos e ICV' },
  { value: 'historial', label: 'Historial de sueldos' },
]

const today = () => new Date().toISOString().slice(0, 10)

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('afiliados')

  return (
    <div className="space-y-4">
      <Tabs tabs={REPORT_TABS} value={tab} onChange={setTab} />
      {tab === 'afiliados' && <AffiliatesReport />}
      {tab === 'cobranza' && <CollectionReport />}
      {tab === 'periodos' && <PeriodsReport />}
      {tab === 'historial' && <HistoricalIncomesReport />}
    </div>
  )
}

function AffiliatesReport() {
  const { affiliates, loading } = useAffiliates()
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'todos'>('todos')

  const filtered = affiliates.filter((a) => statusFilter === 'todos' || a.status === statusFilter)

  function exportCsv() {
    downloadCsv(
      `afiliados_${today()}`,
      filtered.map((a) => ({
        DNI: a.dni,
        Nombres: a.firstName,
        Apellidos: a.lastName,
        Correo: a.email ?? '',
        Celular: a.phone ?? '',
        'Fecha afiliación': a.affiliationDate,
        Estado: a.status,
        'N° pólizas': a.policies.length,
        Observaciones: a.observations ?? '',
      })),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AffiliateStatus | 'todos')} className={`${fieldClass()} sm:w-56`}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pendiente">Pendiente</option>
          <option value="inactivo">Inactivo</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Afiliado</th>
                  <th className="px-4 py-2 font-medium">DNI</th>
                  <th className="px-4 py-2 font-medium">Fecha afiliación</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Pólizas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {a.firstName} {a.lastName}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{a.dni}</td>
                    <td className="px-4 py-2 text-slate-600">{formatDate(a.affiliationDate)}</td>
                    <td className="px-4 py-2 text-slate-600">{a.status}</td>
                    <td className="px-4 py-2 text-slate-600">{a.policies.length}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function CollectionReport() {
  const { payments, loading } = usePayments()
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'todos'>('todos')
  const [monthFilter, setMonthFilter] = useState<string>('todos')

  const months = Array.from(new Set(payments.map((p) => p.yearMonth))).sort((a, b) => b.localeCompare(a))
  const filtered = payments.filter(
    (p) => (statusFilter === 'todos' || p.status === statusFilter) && (monthFilter === 'todos' || p.yearMonth === monthFilter),
  )

  function exportCsv() {
    downloadCsv(
      `cobranza_${today()}`,
      filtered.map((p) => ({
        Afiliado: `${p.affiliate.firstName} ${p.affiliate.lastName}`,
        DNI: p.affiliate.dni,
        Póliza: p.policy.policyNumber,
        Mes: p.yearMonth,
        'Monto esperado': p.expectedAmount,
        'Monto pagado': p.paidAmount ?? '',
        'Fecha de pago': p.paymentDate ?? '',
        Estado: p.status,
        Reprogramada: p.isRescheduled ? 'Sí' : 'No',
      })),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={`${fieldClass()} sm:w-44`}>
            <option value="todos">Todos los meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'todos')} className={`${fieldClass()} sm:w-56`}>
            <option value="todos">Todos los estados</option>
            <option value="pagado">Pagado</option>
            <option value="no_pagado">No pagado</option>
            <option value="pendiente_confirmar">Pendiente de confirmar</option>
            <option value="no_corresponde">No corresponde</option>
          </select>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Afiliado</th>
                  <th className="px-4 py-2 font-medium">Póliza</th>
                  <th className="px-4 py-2 font-medium">Mes</th>
                  <th className="px-4 py-2 font-medium">Monto esperado</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {p.affiliate.firstName} {p.affiliate.lastName}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.policy.policyNumber}</td>
                    <td className="px-4 py-2 text-slate-600">{p.yearMonth}</td>
                    <td className="px-4 py-2 text-slate-600">{p.expectedAmount}</td>
                    <td className="px-4 py-2 text-slate-600">{p.status}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Sin resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function PeriodsReport() {
  const { periods, loading: periodsLoading } = usePeriodsAdmin()
  const { rows, loading: reportLoading } = usePeriodsReport(periods)
  const loading = periodsLoading || reportLoading

  function exportCsv() {
    downloadCsv(
      `periodos_${today()}`,
      rows.map((r) => ({
        Período: r.name,
        'Fecha inicio': r.startDate,
        'Fecha fin': r.endDate,
        Estado: r.status,
        'Emisión Vida': r.vidaEmission,
        'Meta Emisión Vida': r.vidaEmissionGoal,
        '% Incentivo': r.incentiveTier?.valueType === 'percentage' ? r.incentiveTier.percentage : '',
        'Monto fijo Incentivo': r.incentiveTier?.valueType === 'fixed' ? r.incentiveTier.fixedAmount : '',
        'Incentivo Base': r.baseIncentive ?? '',
        'Ratio Cobranza': r.collectionRatio ?? '',
        'Factor Cobranza': r.collectionFactor ?? '',
        '% ICV': r.icvPercentage ?? '',
        'Factor ICV': r.icvFactor ?? '',
        'Incentivo Final': r.finalIncentive ?? '',
      })),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Período</th>
                  <th className="px-4 py-2 font-medium">Emisión Vida</th>
                  <th className="px-4 py-2 font-medium">Tramo Incentivo</th>
                  <th className="px-4 py-2 font-medium">Incentivo Base</th>
                  <th className="px-4 py-2 font-medium">Ratio Cobranza</th>
                  <th className="px-4 py-2 font-medium">Factor Cobranza</th>
                  <th className="px-4 py-2 font-medium">% ICV</th>
                  <th className="px-4 py-2 font-medium">Factor ICV</th>
                  <th className="px-4 py-2 font-medium">Incentivo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.periodId}>
                    <td className="px-4 py-2 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600">{r.vidaEmission.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatIncentiveTierValue(r.incentiveTier)}</td>
                    <td className="px-4 py-2 text-slate-600">{r.baseIncentive != null ? r.baseIncentive.toFixed(2) : '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.collectionRatio != null ? `${r.collectionRatio.toFixed(2)}%` : '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.collectionFactor != null ? r.collectionFactor.toFixed(2) : '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.icvPercentage != null ? `${r.icvPercentage.toFixed(2)}%` : '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.icvFactor != null ? r.icvFactor.toFixed(2) : '—'}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{r.finalIncentive != null ? r.finalIncentive.toFixed(2) : '—'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Aún no hay períodos configurados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
