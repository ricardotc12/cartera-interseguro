import { Badge } from '@/components/ui/Badge'
import type { PaymentStatus } from '@/types/domain'

const toneByStatus: Record<PaymentStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  pagado: 'success',
  no_pagado: 'danger',
  pendiente_confirmar: 'warning',
  no_corresponde: 'neutral',
}

const labelByStatus: Record<PaymentStatus, string> = {
  pagado: 'Pagado',
  no_pagado: 'No pagado',
  pendiente_confirmar: 'Pendiente de confirmar',
  no_corresponde: 'No corresponde',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={toneByStatus[status]} dot>
      {labelByStatus[status]}
    </Badge>
  )
}
