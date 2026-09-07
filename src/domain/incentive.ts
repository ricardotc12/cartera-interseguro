import type { IncentiveRule } from '@/types/domain'
import { findRangeMatch } from './rangeRules'

/** Tramo de incentivo alcanzado según la Emisión Vida (REGLA 2). Null si ningún tramo del período cubre el monto. */
export function findIncentiveTier(vidaEmission: number, rules: IncentiveRule[]): IncentiveRule | null {
  return findRangeMatch(vidaEmission, rules)
}

/**
 * Incentivo Base (REGLA 3). Depende del tipo de tramo alcanzado: si es un
 * MONTO FIJO (como maneja Interseguro hoy los tramos más bajos), el
 * Incentivo Base es directamente ese monto, sin multiplicar por la Emisión
 * Vida. Si es un PORCENTAJE (el tramo más alto hoy; todos cuando Interseguro
 * confirme el nuevo esquema), Incentivo Base = Emisión Vida × % Incentivo.
 */
export function calculateBaseIncentive(vidaEmission: number, tier: IncentiveRule): number {
  return tier.valueType === 'fixed' ? tier.fixedAmount : vidaEmission * tier.percentage
}

/** Incentivo Final = Incentivo Base × Factor Cobranza × Factor ICV (REGLA 8). */
export function calculateFinalIncentive(
  baseIncentive: number,
  collectionFactor: number,
  icvFactor: number,
): number {
  return baseIncentive * collectionFactor * icvFactor
}
