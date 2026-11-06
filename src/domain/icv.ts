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
 *
 * Tampoco cuenta la cuota "manual" del propio mes de emisión cuando la
 * afiliación fue del día 2 en adelante (ver `hasManualFirstPayment` en
 * domain/payments.ts): esa primera cuota la cobra la asesora directamente al
 * afiliar, fuera del ciclo de débito automático de Interseguro — su sistema
 * nunca llega a verla, así que tampoco debe sumar al ICV (confirmado contra
 * el reporte oficial: esos meses figuran ahí en cero). Si la afiliación fue
 * el día 1, el débito automático sí alcanza a cobrar ese mismo mes, así que
 * esa cuota del mes de emisión SÍ cuenta normalmente.
 */
export function qualifiesForIcv(policyStatus: AffiliateStatus, policyStartDate: string, paymentYearMonth: string): boolean {
  const isManualFirstPayment = paymentYearMonth.slice(0, 7) === policyStartDate.slice(0, 7) && Number(policyStartDate.slice(8, 10)) >= 2
  if (isManualFirstPayment) return false
  if (policyStatus === 'cancelado') return calculateTenureMonths(policyStartDate, paymentYearMonth) < 12
  return true
}
