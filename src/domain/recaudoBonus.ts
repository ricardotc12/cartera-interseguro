import type { PaymentStatus } from '@/types/domain'
import { calculateTenureMonths } from './policy'

/** Tasa fija del Bono de Recaudo confirmada por la asesora. */
export const RECAUDO_BONUS_RATE = 0.12

/** Antigüedad mínima del agente (en meses) para calificar al Bono de Recaudo. */
export const RECAUDO_BONUS_MIN_TENURE_MONTHS = 7

/** Antigüedad máxima de la póliza (en meses desde su Fecha de Emisión) que participa en la base del Bono de Recaudo. */
export const RECAUDO_BONUS_MAX_POLICY_AGE_MONTHS = 18

interface RecaudoPayment {
  status: PaymentStatus
  paidAmount: number | null
  policyStartDate: string
}

/**
 * Base del Bono de Recaudo: cobranza YA PAGADA (acumulado histórico, no solo
 * del período activo) de pólizas con ≤18 meses de antigüedad desde su Fecha
 * de Emisión.
 */
export function calculateRecaudoBonusBase(
  payments: RecaudoPayment[],
  referenceDate: string,
  maxPolicyAgeMonths = RECAUDO_BONUS_MAX_POLICY_AGE_MONTHS,
): number {
  return payments
    .filter((p) => p.status === 'pagado' && calculateTenureMonths(p.policyStartDate, referenceDate) <= maxPolicyAgeMonths)
    .reduce((sum, p) => sum + (p.paidAmount ?? 0), 0)
}

export function calculateRecaudoBonus(base: number, rate = RECAUDO_BONUS_RATE): number {
  return base * rate
}

/**
 * Califica al Bono de Recaudo si el agente tiene ≥7 meses de antigüedad en
 * Interseguro Y la Emisión Vida del período vigente alcanza la "primera
 * banda" (el tramo más bajo configurado en Incentivos).
 */
export function isEligibleForRecaudoBonus(tenureMonths: number, vidaEmission: number, lowestTierMin: number | null): boolean {
  if (tenureMonths < RECAUDO_BONUS_MIN_TENURE_MONTHS) return false
  if (lowestTierMin == null) return false
  return vidaEmission >= lowestTierMin
}
