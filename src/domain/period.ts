import type { IncentivePeriod } from '@/types/domain'

/**
 * Resuelve a qué período de incentivo pertenece una fecha (límites inclusivos
 * en ambos extremos: `startDate <= date <= endDate`). Los períodos NO son
 * necesariamente meses calendario. Devuelve null cuando la fecha no cae en
 * ningún período configurado — la UI debe advertir y pedir configurar el
 * período correspondiente, nunca inventar uno.
 *
 * Las fechas deben venir en formato ISO 'YYYY-MM-DD', que ordena
 * lexicográficamente igual que cronológicamente, evitando ambigüedades de zona horaria.
 */
export function calculatePeriodForDate<T extends IncentivePeriod>(date: string, periods: T[]): T | null {
  return periods.find((period) => date >= period.startDate && date <= period.endDate) ?? null
}

/**
 * Días que faltan de `referenceDate` a `targetDate` (positivo si `targetDate` es
 * futuro, 0 si es hoy, negativo si ya pasó). Sirve para avisar con anticipación
 * que un período está por finalizar (sección 45), en vez de esperar a que se
 * abra un vacío y recién ahí mostrar la advertencia de "sin período configurado".
 */
export function calculateDaysUntil(targetDate: string, referenceDate: string): number {
  return Math.round((new Date(targetDate).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

/**
 * Meta fija del "Periodo Mes Ponderado" (control de renovación de contrato):
 * la Emisión Vida del mes calendario debe llegar a S/ 13,500. Confirmado por
 * la asesora como un monto fijo, no configurable por período (a diferencia
 * de `vidaEmissionGoal`).
 */
export const MES_PONDERADO_GOAL = 13500

/**
 * Rango del mes calendario (1 al último día del mes) al que pertenece
 * `referenceDate` — el "Periodo Mes Ponderado" (distinto del período de
 * incentivo del agente, que corre del 16 al 15). Ambas fechas ISO 'YYYY-MM-DD'.
 */
export function getCalendarMonthRange(referenceDate: string): { startDate: string; endDate: string } {
  const [year, month] = referenceDate.slice(0, 7).split('-').map(Number) as [number, number]
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return { startDate: `${year}-${mm}-01`, endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}` }
}
