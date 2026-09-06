import type { IncentiveRule } from '@/types/domain'
import { findRangeMatch } from './rangeRules'

/** % de incentivo según el tramo de Emisión Vida alcanzado (REGLA 2). Null si ningún tramo del período cubre el monto. */
export function calculateIncentivePercentage(vidaEmission: number, rules: IncentiveRule[]): number | null {
  return findRangeMatch(vidaEmission, rules)?.percentage ?? null
}

/** Incentivo Base = Emisión Vida × % Incentivo (REGLA 3). */
export function calculateBaseIncentive(vidaEmission: number, incentivePercentage: number): number {
  return vidaEmission * incentivePercentage
}

/** Incentivo Final = Incentivo Base × Factor Cobranza × Factor ICV (REGLA 8). */
export function calculateFinalIncentive(
  baseIncentive: number,
  collectionFactor: number,
  icvFactor: number,
): number {
  return baseIncentive * collectionFactor * icvFactor
}
