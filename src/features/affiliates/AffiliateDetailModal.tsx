import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDate } from '@/lib/format'
import { calculateDaysActive, calculatePeriodForDate, calculateVidaEmission, COVERAGES } from '@/domain'
import type { IncentivePeriod, Policy } from '@/types/domain'
import type { AffiliateWithPolicies, PolicyInput } from '@/hooks/useAffiliates'
import { StatusBadge } from './StatusBadge'
import { PolicyFormModal } from './PolicyFormModal'

const MODALIDAD_LABEL: Record<Policy['modalidad'], string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

function coverageLabel(code: string): string {
  return COVERAGES.find((c) => c.code === code)?.label ?? code
}

interface AffiliateDetailModalProps {
  open: boolean
  onClose: () => void
  affiliate: AffiliateWithPolicies
  periods: IncentivePeriod[]
  onCreatePolicy: (affiliateId: string, input: PolicyInput) => Promise<{ error: string | null }>
  onUpdatePolicy: (id: string, input: PolicyInput) => Promise<{ error: string | null }>
  onDeletePolicy: (id: string) => Promise<{ error: string | null }>
}

function VidaEmissionCell({ policy, periods }: { policy: Policy; periods: IncentivePeriod[] }) {
  const period = calculatePeriodForDate(policy.startDate, periods)
  if (!period) {
    return <span className="text-xs text-amber-600">Sin período configurado para esta fecha</span>
  }
  const vidaEmission = calculateVidaEmission(policy.emissionAmount, period.vidaEmissionMultiplier)
  return <span className="font-medium text-slate-700">{formatCurrency(vidaEmission)}</span>
}

export function AffiliateDetailModal({
  open,
  onClose,
  affiliate,
  periods,
  onCreatePolicy,
  onUpdatePolicy,
  onDeletePolicy,
}: AffiliateDetailModalProps) {
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | undefined>(undefined)
  const [deletingPolicy, setDeletingPolicy] = useState<Policy | undefined>(undefined)

  return (
    <Modal open={open} onClose={onClose} title={`${affiliate.firstName} ${affiliate.lastName}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">DNI</p>
            <p className="font-medium text-slate-700">{affiliate.dni}</p>
          </div>
          <div>
            <p className="text-slate-400">Estado</p>
            <StatusBadge status={affiliate.status} />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400">Correo</p>
            <p className="break-words font-medium text-slate-700">{affiliate.email ?? '—'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-slate-400">Celular</p>
            <p className="break-words font-medium text-slate-700">{affiliate.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-400">Fecha de Emisión</p>
            <p className="font-medium text-slate-700">{formatDate(affiliate.affiliationDate)}</p>
          </div>
        </div>

        {affiliate.observations && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{affiliate.observations}</div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Pólizas</h3>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditingPolicy(undefined)
                setPolicyModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar póliza
            </Button>
          </div>

          {affiliate.policies.length === 0 ? (
            <p className="text-sm text-slate-400">Este afiliado aún no tiene pólizas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {affiliate.policies.map((policy) => (
                <li key={policy.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        Póliza {policy.policyNumber}{' '}
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                          {MODALIDAD_LABEL[policy.modalidad]}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Monto de Emisión: {formatCurrency(policy.emissionAmount)} · Monto de Cobranza:{' '}
                        {formatCurrency(policy.collectionAmount)} · Emisión: {formatDate(policy.startDate)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Emisión Vida: <VidaEmissionCell policy={policy} periods={periods} />
                      </p>
                      {policy.coverages.length > 0 && (
                        <p className="mt-1 text-xs text-slate-400">
                          Coberturas: {policy.coverages.map((c) => `${coverageLabel(c.coverageCode)} (${formatCurrency(c.amount)})`).join(', ')}
                        </p>
                      )}
                      {policy.status === 'cancelado' && policy.cancellationDate && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          Cancelada el {formatDate(policy.cancellationDate)} — estuvo vigente{' '}
                          {calculateDaysActive(policy.startDate, policy.cancellationDate)} días
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge status={policy.status} />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPolicy(policy)
                          setPolicyModalOpen(true)
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar póliza" aria-label="Editar póliza"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPolicy(policy)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar póliza" aria-label="Eliminar póliza"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {policyModalOpen && (
        <PolicyFormModal
          open={policyModalOpen}
          policy={editingPolicy}
          onClose={() => setPolicyModalOpen(false)}
          onSubmit={(input) => (editingPolicy ? onUpdatePolicy(editingPolicy.id, input) : onCreatePolicy(affiliate.id, input))}
        />
      )}

      {deletingPolicy && (
        <ConfirmDialog
          open={!!deletingPolicy}
          title="Eliminar póliza"
          description={`Se eliminará la póliza ${deletingPolicy.policyNumber} y todos sus pagos registrados. Esta acción no se puede deshacer.`}
          onClose={() => setDeletingPolicy(undefined)}
          onConfirm={() => onDeletePolicy(deletingPolicy.id)}
        />
      )}
    </Modal>
  )
}
