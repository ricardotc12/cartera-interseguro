import type { PaymentStatus } from '@/types/domain'

/**
 * Meses que corresponde controlar el pago de una póliza, desde el mes de su
 * fecha de inicio hasta diciembre del año de la fecha de referencia
 * (inclusive) — se ve el calendario completo del año como pendiente desde
 * ya, no solo lo ya vencido. No asume que todas las pólizas deben pagos
 * desde un mes fijo (sección 19): cada una arranca en su propio mes según
 * cuándo se afilió. Al empezar un año nuevo, la fecha de referencia cae en
 * ese año y se generan sus 12 meses. Devuelve fechas ISO del primer día de
 * cada mes ('YYYY-MM-01').
 */
export function generateOwedMonths(startDate: string, referenceDate: string): string[] {
  const [startYear, startMonth] = startDate.slice(0, 7).split('-').map(Number) as [number, number]
  const [endYear] = referenceDate.slice(0, 7).split('-').map(Number) as [number, number]
  const endMonth = 12

  const months: string[] = []
  if (startYear > endYear) return months

  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}-01`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

/**
 * Días de atraso de un pago pendiente respecto a su fecha de vencimiento.
 * Solo tiene sentido si se registró una fecha de vencimiento (sección 20,
 * "preparar para fecha de vencimiento") — no se inventa un vencimiento por
 * defecto. Devuelve null si no hay vencimiento o si aún no se ha vencido.
 */
export function calculateDaysOverdue(dueDate: string | null, referenceDate: string): number | null {
  if (!dueDate) return null
  const diffDays = Math.floor((new Date(referenceDate).getTime() - new Date(dueDate).getTime()) / 86_400_000)
  return diffDays > 0 ? diffDays : null
}

/**
 * Fecha de corte (vencimiento) por defecto de un mes de cobranza: el día 15
 * de ese mismo mes — la asesora confirmó que el ciclo de Interseguro corre
 * del 16 de un mes al 15 del siguiente, y el pago se atribuye/vence en el
 * mes en el que cae ese día 15. Se usa solo al generar el mes por primera
 * vez; si la asesora edita manualmente la fecha de vencimiento de un pago,
 * esa edición manual prevalece siempre.
 */
export function defaultDueDateForMonth(yearMonth: string): string {
  return `${yearMonth.slice(0, 7)}-15`
}

/**
 * Fecha de vencimiento a usar en pantalla: la registrada en el pago si
 * existe (manual o autogenerada), o si no — pagos que quedaron sin due_date
 * de antes de que la app empezara a fijarlo sola — la fecha de corte por
 * defecto del mes (día 15). Así "Pendiente" vs "No pagado" se calcula bien
 * en todos los pagos, sin depender de haber corrido ninguna migración.
 */
export function effectiveDueDate(yearMonth: string, dueDate: string | null): string {
  return dueDate ?? defaultDueDateForMonth(yearMonth)
}

/**
 * Estado a mostrar en pantalla para un pago. Aunque en base de datos un mes
 * recién generado ya queda como 'no_pagado' (para poder listarlo desde ya,
 * sección 19), no corresponde alarmar a la asesora con "No pagado" antes de
 * que llegue su fecha de corte: se muestra como "pendiente" hasta el día de
 * vencimiento (inclusive) y recién después pasa a mostrarse como "No
 * pagado". Los demás estados (pagado, pendiente_confirmar, no_corresponde)
 * se muestran tal cual, sin depender de la fecha.
 */
export function getDisplayPaymentStatus(
  status: PaymentStatus,
  dueDate: string | null,
  referenceDate: string,
): PaymentStatus | 'pendiente' {
  if (status !== 'no_pagado') return status
  if (!dueDate) return status
  return referenceDate <= dueDate ? 'pendiente' : status
}
