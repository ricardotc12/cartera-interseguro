/** DNI peruano: exactamente 8 dígitos (sección 33). */
export function isValidDni(value: string): boolean {
  return /^[0-9]{8}$/.test(value)
}

/** Formato de correo básico (sección 33). Vacío se considera válido: el campo es opcional. */
export function isValidEmail(value: string): boolean {
  if (!value) return true
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

/** Monto no negativo (sección 33). */
export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}
