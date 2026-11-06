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
 *
 * `stepMonths` es cada cuántos meses le toca cobrar según la modalidad de la
 * póliza (1 mensual, 3 trimestral, 6 semestral, 12 anual — ver
 * `modalidadStepMonths`): la cuota de cobranza no se genera todos los meses,
 * solo cada `stepMonths` meses contados desde el mes de la fecha de inicio.
 */
export function generateOwedMonths(startDate: string, referenceDate: string, stepMonths = 1): string[] {
  const [startYear, startMonth] = startDate.slice(0, 7).split('-').map(Number) as [number, number]
  const [endYear] = referenceDate.slice(0, 7).split('-').map(Number) as [number, number]
  const endMonth = 12

  const months: string[] = []
  if (startYear > endYear) return months

  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}-01`)
    month += stepMonths
    while (month > 12) {
      month -= 12
      year += 1
    }
  }

  return months
}

/**
 * Mes efectivo en que arranca la cobranza de una póliza, según el corte de
 * débito automático que confirmó la asesora: si la póliza se emite el día 1
 * del mes, esa primera cuota cae el 20 de ese MISMO mes; si se emite del día
 * 2 en adelante, el corte de ese mes ya pasó y la primera cuota recién cae
 * el 20 del mes SIGUIENTE (ej. emisión 01/09 → corte 20/09; emisión 02/10 →
 * corte 20/11). A partir de este mes efectivo, `generateOwedMonths` sigue
 * generando las cuotas siguientes según la modalidad (mensual/trimestral/
 * semestral/anual). Devuelve 'YYYY-MM-01'.
 */
export function effectiveFirstOwedMonth(startDate: string): string {
  const day = Number(startDate.slice(8, 10))
  const [year, month] = startDate.slice(0, 7).split('-').map(Number) as [number, number]
  if (day <= 1) return `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

/**
 * true si, además del ciclo de débito automático (que arranca en
 * `effectiveFirstOwedMonth`), la póliza tiene una cuota adicional "manual" en
 * su propio mes de emisión — la que la asesora cobra ella misma al afiliar al
 * cliente (confirmado: lo hace siempre, sin importar el día). Solo aplica si
 * la afiliación fue del día 2 en adelante: si fue el día 1, el débito
 * automático ya alcanza a cobrar ese mismo mes (ver `effectiveFirstOwedMonth`)
 * y no hace falta una cuota manual aparte — serían el mismo mes.
 */
export function hasManualFirstPayment(startDate: string): boolean {
  return Number(startDate.slice(8, 10)) >= 2
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
 * Fecha de corte (vencimiento) por defecto de un mes de cobranza: el día 20
 * de ese mismo mes — la asesora confirmó que Interseguro cobra las pólizas
 * el día 20 de cada mes. Se usa solo al generar el mes por primera vez; si
 * la asesora edita manualmente la fecha de vencimiento de un pago, esa
 * edición manual prevalece siempre.
 */
export function defaultDueDateForMonth(yearMonth: string): string {
  return `${yearMonth.slice(0, 7)}-20`
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
 * Días de anticipación al vencimiento en que un pago pasa de "Al día" a
 * "Pendiente": recién un día antes del cobro (el 19, si el cobro es el 20)
 * empieza a alertar — antes de eso, aunque el mes ya esté generado en base
 * de datos como 'no_pagado', no hay nada que avisarle todavía a la asesora.
 */
export const PENDING_WINDOW_DAYS = 1

/**
 * Estado a mostrar en pantalla para un pago. Aunque en base de datos un mes
 * recién generado ya queda como 'no_pagado' (para poder listarlo desde ya,
 * sección 19), no corresponde alarmar a la asesora con "No pagado" (ni
 * siquiera "Pendiente") mucho antes de que llegue la fecha de cobro:
 * - Más de `PENDING_WINDOW_DAYS` días antes del vencimiento: "Al día".
 * - Desde `PENDING_WINDOW_DAYS` días antes y hasta el propio vencimiento
 *   (inclusive): "Pendiente".
 * - Pasado el vencimiento: "No pagado".
 * Los demás estados (pagado, pendiente_confirmar, no_corresponde) se
 * muestran tal cual, sin depender de la fecha.
 */
export function getDisplayPaymentStatus(
  status: PaymentStatus,
  dueDate: string | null,
  referenceDate: string,
): PaymentStatus | 'pendiente' | 'al_dia' {
  if (status !== 'no_pagado') return status
  if (!dueDate) return status
  if (referenceDate > dueDate) return status
  const daysUntilDue = Math.round((new Date(dueDate).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
  return daysUntilDue <= PENDING_WINDOW_DAYS ? 'pendiente' : 'al_dia'
}
