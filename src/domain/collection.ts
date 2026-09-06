import type { CollectionFactorRule, Payment } from '@/types/domain'
import { findRangeMatch } from './rangeRules'

type BillablePayment = Pick<Payment, 'expectedAmount' | 'paidAmount' | 'isRescheduled' | 'status'>

/**
 * Ratio Cobranza = primas recurrentes cobradas / total de primas por cobrar,
 * dentro de la ventana de fechas de un período de incentivo (REGLA 4).
 * Las primas reprogramadas se excluyen por completo, tanto del numerador
 * como del denominador (REGLA 5). Expresado en puntos porcentuales (0-100).
 * Devuelve null cuando no hay primas por cobrar en el período (denominador 0),
 * en vez de inventar un ratio.
 */
export function calculateCollectionRatio(paymentsInPeriod: BillablePayment[]): number | null {
  const billable = paymentsInPeriod.filter((p) => !p.isRescheduled && p.status !== 'no_corresponde')
  const totalExpected = billable.reduce((sum, p) => sum + p.expectedAmount, 0)
  if (totalExpected === 0) return null

  const totalCollected = billable.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0)
  return (totalCollected / totalExpected) * 100
}

/** Factor Cobranza según el tramo configurado para el período (REGLA 6). Null si ningún tramo cubre el ratio. */
export function calculateCollectionFactor(collectionRatioPct: number, rules: CollectionFactorRule[]): number | null {
  return findRangeMatch(collectionRatioPct, rules)?.factor ?? null
}
