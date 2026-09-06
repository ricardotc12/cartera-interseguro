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
