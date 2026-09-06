/** Emisión Vida = Monto Afiliación × multiplicador vigente del período (REGLA 1). */
export function calculateVidaEmission(affiliationAmount: number, multiplier: number): number {
  return affiliationAmount * multiplier
}
