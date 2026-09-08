import { Badge } from '@/components/ui/Badge'
import type { PaymentStatus } from '@/types/domain'

export type DisplayPaymentStatus = PaymentStatus | 'pendiente' | 'al_dia'

const toneByStatus: Record<DisplayPaymentStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  pagado: 'success',
  no_pagado: 'danger',
  pendiente_confirmar: 'warning',
  no_corresponde: 'neutral',
  pendiente: 'warning',
  al_dia: 'success',
}

const labelByStatus: Record<DisplayPaymentStatus, string> = {
  pagado: 'Pagado',
  no_pagado: 'No pagado',
  pendiente_confirmar: 'Pendiente de confirmar',
  no_corresponde: 'No corresponde',
  pendiente: 'Pendiente',
  al_dia: 'Al día',
}

export function PaymentStatusBadge({ status }: { status: DisplayPaymentStatus }) {
  return (
    <Badge tone={toneByStatus[status]} dot>
      {labelByStatus[status]}
    </Badge>
  )
}
