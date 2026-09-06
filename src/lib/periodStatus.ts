import type { PeriodStatus } from '@/types/domain'

export const PERIOD_STATUS_TONE: Record<PeriodStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  draft: 'warning',
  closed: 'neutral',
}

export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  active: 'Activo',
  draft: 'Borrador',
  closed: 'Cerrado',
}
