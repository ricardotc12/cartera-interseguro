import { Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/format'
import type { AffiliateWithPolicies } from '@/hooks/useAffiliates'

interface RealPolicyTotalModalProps {
  open: boolean
  onClose: () => void
  affiliates: AffiliateWithPolicies[]
}

/**
 * Monto REAL de todas las pólizas (lo que de verdad pagan los afiliados) — a diferencia de
 * "Emisión Vida" en el Dashboard, que multiplica ese monto por el multiplicador del período
 * (hoy ×10) porque es el número que usa Interseguro para calcular tramos de incentivo, no el
 * dinero real. Esta suma va creciendo sola cada vez que se agrega una póliza nueva, nunca se
 * multiplica, y no está acotada al período vigente — es el total acumulado de toda la cartera.
 */
export function RealPolicyTotalModal({ open, onClose, affiliates }: RealPolicyTotalModalProps) {
  if (!open) return null

  const allPolicies = affiliates.flatMap((a) => a.policies)
  const total = allPolicies.reduce((sum, p) => sum + p.affiliationAmount, 0)
  const average = allPolicies.length > 0 ? total / allPolicies.length : 0

  return (
    <Modal open={open} onClose={onClose} title="Monto real de pólizas" size="alert">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <p className="text-sm text-slate-700">
            Suma de lo que realmente pagan tus afiliados por sus pólizas — sin el multiplicador de Emisión Vida.
          </p>
        </div>

        <div className="rounded-xl bg-primary-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Total real acumulado</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-400">Pólizas</p>
            <p className="text-lg font-semibold text-slate-900">{allPolicies.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Promedio por póliza</p>
            <p className="text-lg font-semibold text-slate-900">{allPolicies.length > 0 ? formatCurrency(average) : '—'}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Este total crece solo cada vez que registras una póliza nueva en Afiliados — no depende del período vigente.
        </p>
      </div>
    </Modal>
  )
}
