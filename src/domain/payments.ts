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
