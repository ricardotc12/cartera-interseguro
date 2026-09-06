import { Badge } from '@/components/ui/Badge'
import type { AffiliateStatus } from '@/types/domain'

const toneByStatus: Record<AffiliateStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
  activo: 'success',
  pendiente: 'warning',
  inactivo: 'neutral',
  cancelado: 'danger',
}

const labelByStatus: Record<AffiliateStatus, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente',
  inactivo: 'Inactivo',
  cancelado: 'Cancelado',
}

export function StatusBadge({ status }: { status: AffiliateStatus }) {
  return (
    <Badge tone={toneByStatus[status]} dot>
      {labelByStatus[status]}
    </Badge>
  )
}
