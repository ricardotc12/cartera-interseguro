import type { IcvFactorRule } from '@/types/domain'
import { findRangeMatch } from './rangeRules'

/**
 * Factor ICV según el tramo configurado para el período (REGLA 7). El % ICV en
 * sí se registra manualmente (módulo aislado) hasta contar con la fórmula
 * exacta que usa Interseguro — no se inventa aquí. Null si ningún tramo cubre el valor.
 */
export function calculateICVFactor(icvPct: number, rules: IcvFactorRule[]): number | null {
  return findRangeMatch(icvPct, rules)?.factor ?? null
}
