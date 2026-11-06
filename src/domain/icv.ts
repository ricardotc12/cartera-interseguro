import type { AffiliateStatus, IcvFactorRule } from '@/types/domain'
import { findRangeMatch } from './rangeRules'
import { calculateTenureMonths } from './policy'

/**
 * Factor ICV según el tramo configurado para el período (REGLA 7).
 */
export function calculateICVFactor(icvPct: number, rules: IcvFactorRule[]): number | null {
  return findRangeMatch(icvPct, rules)?.factor ?? null
}

/**
 * ICV = (recaudado / por cobrar) de las cuotas que corresponden: las de pólizas
 * activas/pendientes cuentan siempre; las de pólizas ANULADAS solo cuentan
 * dentro de los primeros 12 meses desde su Fecha de Emisión (confirmado contra
 * el reporte oficial de Interseguro: una póliza anulada sigue "arrastrando" el
 * por-cobrar de su primer año, con recaudado en 0, bajando el ICV). Pasado el
 * año desde la emisión, una cuota de póliza anulada deja de contar.
 */
export function qualifiesForIcv(policyStatus: AffiliateStatus, policyStartDate: string, paymentYearMonth: string): boolean {
  if (policyStatus === 'cancelado') return calculateTenureMonths(policyStartDate, paymentYearMonth) < 12
  return true
}
