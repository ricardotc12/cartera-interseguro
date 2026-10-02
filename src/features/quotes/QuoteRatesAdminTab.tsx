import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { findProtectionType } from '@/domain'
import { formatCurrency, formatPercentage } from '@/lib/format'
import type { QuoteRate } from '@/types/domain'
import type { QuoteRateInput } from '@/hooks/useQuoteRates'
import { QuoteRateFormModal } from './QuoteRateFormModal'

interface QuoteRatesAdminTabProps {
  rates: QuoteRate[]
  loading: boolean
  error: string | null
  createRate: (input: QuoteRateInput) => Promise<{ error: string | null }>
  updateRate: (id: string, input: QuoteRateInput) => Promise<{ error: string | null }>
  deleteRate: (id: string) => Promise<{ error: string | null }>
}

function ageLabel(rate: QuoteRate): string {
  return rate.ageMin === rate.ageMax ? `${rate.ageMin} años` : `${rate.ageMin}-${rate.ageMax} años`
}

export function QuoteRatesAdminTab({ rates, loading, error, createRate, updateRate, deleteRate }: QuoteRatesAdminTabProps) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<QuoteRate | undefined>(undefined)
  const [deleting, setDeleting] = useState<QuoteRate | undefined>(undefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Base de tarifas</h2>
          <p className="text-sm text-slate-500">Registra aquí los valores reales por edad, producto, plan, protección y período.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nueva tarifa
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {loading ? (
        <Card className="overflow-hidden">
          <TableRowsSkeleton rows={5} columns={6} />
        </Card>
      ) : rates.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-500">
            Aún no has registrado ninguna tarifa. Agrega la primera para empezar a usar el Simulador.
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Edad</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Protección</th>
                  <th className="px-4 py-3 font-medium">Período</th>
                  <th className="px-4 py-3 font-medium">Prima mensual</th>
                  <th className="px-4 py-3 font-medium">Monto asegurado</th>
                  <th className="px-4 py-3 font-medium">% Devolución</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{ageLabel(rate)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{rate.product}</td>
                    <td className="px-4 py-3 text-slate-600">{rate.plan}</td>
                    <td className="px-4 py-3 text-slate-600">{findProtectionType(rate.protectionType).label}</td>
                    <td className="px-4 py-3 text-slate-600">{rate.coverageYears} años</td>
                    <td className="px-4 py-3 text-slate-600">{rate.primaMensual != null ? formatCurrency(rate.primaMensual) : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{rate.montoAsegurado != null ? formatCurrency(rate.montoAsegurado) : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{rate.pctDevolucion != null ? formatPercentage(rate.pctDevolucion, 0) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(rate)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar" aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(rate)}
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

      {creating && <QuoteRateFormModal open={creating} onClose={() => setCreating(false)} onSubmit={createRate} />}

      {editing && (
        <QuoteRateFormModal
          open={!!editing}
          rate={editing}
          onClose={() => setEditing(undefined)}
          onSubmit={(input) => updateRate(editing.id, input)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          title="Eliminar tarifa"
          description={`Se eliminará la tarifa de ${ageLabel(deleting)} · ${deleting.product} · ${findProtectionType(deleting.protectionType).label}.`}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => deleteRate(deleting.id)}
        />
      )}
    </div>
  )
}
