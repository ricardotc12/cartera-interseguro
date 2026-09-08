import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react'
import { useAffiliates, type AffiliateWithPolicies } from '@/hooks/useAffiliates'
import { usePeriods } from '@/hooks/usePeriods'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldClass } from '@/components/ui/FormField'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/format'
import type { AffiliateStatus } from '@/types/domain'
import { StatusBadge } from './StatusBadge'
import { AffiliateFormModal } from './AffiliateFormModal'
import { AffiliateDetailModal } from './AffiliateDetailModal'

const STATUS_FILTERS: { value: AffiliateStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'cancelado', label: 'Cancelado' },
]

function matchesSearch(affiliate: AffiliateWithPolicies, query: string): boolean {
  if (!query) return true
  const haystack = `${affiliate.firstName} ${affiliate.lastName} ${affiliate.dni}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function AffiliatesPage() {
  const {
    affiliates,
    loading,
    error,
    createAffiliateWithPolicy,
    updateAffiliate,
    deleteAffiliate,
    createPolicy,
    updatePolicy,
    deletePolicy,
  } = useAffiliates()
  const { periods } = usePeriods()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AffiliateStatus | 'todos'>('todos')

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AffiliateWithPolicies | undefined>(undefined)
  const [viewing, setViewing] = useState<AffiliateWithPolicies | undefined>(undefined)
  const [deleting, setDeleting] = useState<AffiliateWithPolicies | undefined>(undefined)

  const filtered = useMemo(
    () =>
      affiliates.filter(
        (a) => matchesSearch(a, search) && (statusFilter === 'todos' || a.status === statusFilter),
      ),
    [affiliates, search, statusFilter],
  )

  function summarizePolicies(affiliate: AffiliateWithPolicies): string {
    const [first, ...rest] = affiliate.policies
    if (!first) return 'Sin póliza'
    if (rest.length === 0) return `Póliza ${first.policyNumber}`
    return `${affiliate.policies.length} pólizas`
  }

  /** Para la columna "Póliza" de la tabla de escritorio: el encabezado ya dice "Póliza", no hace falta repetirlo en cada celda. */
  function policyColumnValue(affiliate: AffiliateWithPolicies): string {
    const [first, ...rest] = affiliate.policies
    if (!first) return 'Sin póliza'
    if (rest.length === 0) return first.policyNumber
    return `${affiliate.policies.length} pólizas`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI…"
              className={`${fieldClass()} pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AffiliateStatus | 'todos')}
            className={`${fieldClass()} sm:w-48`}
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo afiliado
        </Button>
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center text-sm text-slate-500">
            <Users className="mb-3 h-8 w-8 text-slate-300" />
            {affiliates.length === 0 ? 'Aún no has registrado afiliados.' : 'Ningún afiliado coincide con la búsqueda.'}
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
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Póliza</th>
                  <th className="px-4 py-3 font-medium">Afiliación</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {affiliate.firstName} {affiliate.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{affiliate.dni}</td>
                    <td className="px-4 py-3 text-slate-600">{policyColumnValue(affiliate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(affiliate.affiliationDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={affiliate.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setViewing(affiliate)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Ver detalle" aria-label="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(affiliate)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar" aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(affiliate)}
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
          </Card>

          {/* Móvil: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((affiliate) => (
              <Card key={affiliate.id} onClick={() => setViewing(affiliate)} className="cursor-pointer active:bg-slate-50">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {affiliate.firstName} {affiliate.lastName}
                      </p>
                      <p className="text-xs text-slate-500">DNI {affiliate.dni}</p>
                    </div>
                    <StatusBadge status={affiliate.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{summarizePolicies(affiliate)}</span>
                    <span>{formatDate(affiliate.affiliationDate)}</span>
                  </div>
                  <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(affiliate)
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Editar" aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleting(affiliate)
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar" aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      <AffiliateFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmitCreate={createAffiliateWithPolicy} />

      {editing && (
        <AffiliateFormModal
          open={!!editing}
          affiliate={editing}
          onClose={() => setEditing(undefined)}
          onSubmitEdit={(patch) => updateAffiliate(editing.id, patch)}
        />
      )}

      {viewing && (
        <AffiliateDetailModal
          open={!!viewing}
          affiliate={affiliates.find((a) => a.id === viewing.id) ?? viewing}
          periods={periods}
          onClose={() => setViewing(undefined)}
          onCreatePolicy={createPolicy}
          onUpdatePolicy={updatePolicy}
          onDeletePolicy={deletePolicy}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          title="Eliminar afiliado"
          description={`Se eliminará a ${deleting.firstName} ${deleting.lastName} junto con sus ${deleting.policies.length} póliza(s) y todos los pagos registrados. Esta acción no se puede deshacer.`}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => deleteAffiliate(deleting.id)}
        />
      )}
    </div>
  )
}
