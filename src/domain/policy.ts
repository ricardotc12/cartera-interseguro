/**
 * Días que una póliza estuvo vigente entre su Fecha de Emisión y su Fecha de
 * Cancelación (ambas inclusive del día de emisión). Null si todavía no se
 * canceló — no se inventa un valor mientras la póliza sigue activa.
 */
export function calculateDaysActive(startDate: string, cancellationDate: string | null): number | null {
  if (!cancellationDate) return null
  return Math.round((new Date(cancellationDate).getTime() - new Date(startDate).getTime()) / 86_400_000)
}

/** Antigüedad en meses completos entre dos fechas (ej. fecha de ingreso del agente a Interseguro y hoy). */
export function calculateTenureMonths(startDate: string, referenceDate: string): number {
  const start = new Date(startDate)
  const reference = new Date(referenceDate)
  let months = (reference.getFullYear() - start.getFullYear()) * 12 + (reference.getMonth() - start.getMonth())
  if (reference.getDate() < start.getDate()) months -= 1
  return Math.max(months, 0)
}
