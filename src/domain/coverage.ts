import type { CoverageCode, Modalidad, PolicyCoverage } from '@/types/domain'

/**
 * Catálogo fijo de las 7 coberturas del producto (REGLA de negocio confirmada
 * por la asesora). Las 2 obligatorias siempre van marcadas; las 5 adicionales
 * son opcionales. El monto de cada cobertura lo tipea el agente a mano — este
 * catálogo solo define el código y la etiqueta, nunca una tarifa.
 */
export const COVERAGES: { code: CoverageCode; label: string; mandatory: boolean }[] = [
  { code: 'fallecimiento', label: 'Fallecimiento', mandatory: true },
  {
    code: 'invalidez_total_adelanto_capital',
    label: 'Invalidez Total por Accidente o Enfermedad (adelanto de capital)',
    mandatory: true,
  },
  { code: 'fallecimiento_accidente', label: 'Fallecimiento por Accidente', mandatory: false },
  { code: 'fallecimiento_accidente_transito', label: 'Fallecimiento por Accidente de Tránsito', mandatory: false },
  { code: 'enfermedades_graves_intervenciones', label: 'Enfermedades Graves e Intervenciones', mandatory: false },
  {
    code: 'enfermedades_graves_adelanto_capital',
    label: 'Enfermedades Graves e Intervenciones (adelanto de capital)',
    mandatory: false,
  },
  { code: 'invalidez_accidental', label: 'Invalidez Accidental', mandatory: false },
]

export const MANDATORY_COVERAGE_CODES: CoverageCode[] = COVERAGES.filter((c) => c.mandatory).map((c) => c.code)

const MODALIDAD_STEP_MONTHS: Record<Modalidad, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
}

/** Cada cuántos meses se genera una cuota de cobranza según la modalidad elegida. */
export function modalidadStepMonths(modalidad: Modalidad): number {
  return MODALIDAD_STEP_MONTHS[modalidad]
}

type CoverageAmount = Pick<PolicyCoverage, 'coverageCode' | 'amount'>

/** Monto de Emisión = suma de las coberturas OBLIGATORIAS marcadas (base de Emisión Vida). */
export function calculateEmissionAmount(coverages: CoverageAmount[]): number {
  return coverages
    .filter((c) => MANDATORY_COVERAGE_CODES.includes(c.coverageCode))
    .reduce((sum, c) => sum + c.amount, 0)
}

/**
 * El monto que el agente tipea por cobertura viene en la escala de Emisión
 * (anualizado), no en lo que el cliente paga por cuota — la asesora confirmó
 * que el Monto de Cobranza real se obtiene dividiendo esa suma entre 10,
 * siempre, sin importar la modalidad ni el multiplicador del período (son
 * cosas distintas, aunque hoy compartan el mismo número).
 */
export const COLLECTION_AMOUNT_DIVISOR = 10

/** Monto de Cobranza = (suma de TODAS las coberturas marcadas) ÷ 10 — lo que el cliente paga por cuota. */
export function calculateCollectionAmount(coverages: CoverageAmount[]): number {
  return coverages.reduce((sum, c) => sum + c.amount, 0) / COLLECTION_AMOUNT_DIVISOR
}
