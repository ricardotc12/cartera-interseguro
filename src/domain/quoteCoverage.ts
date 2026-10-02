import type { ProtectionType } from '@/types/domain'

export type { ProtectionType }

export interface CoverageFlags {
  fallecimiento: boolean
  fallecimientoAccidental: boolean
  invalidezTotal: boolean
  enfermedadesGraves: boolean
}

export interface ProtectionTypeDef {
  id: ProtectionType
  label: string
  coverages: CoverageFlags
}

/**
 * Las 3 alternativas de protección y sus coberturas son las que la asesora dio
 * explícitamente (sección 4 de su especificación) — no se agregan coberturas
 * adicionales ni se inventan variantes nuevas.
 */
export const PROTECTION_TYPES: ProtectionTypeDef[] = [
  {
    id: 'basica',
    label: 'Protección Básica',
    coverages: { fallecimiento: true, fallecimientoAccidental: true, invalidezTotal: false, enfermedadesGraves: false },
  },
  {
    id: 'invalidez',
    label: 'Protección + Invalidez',
    coverages: { fallecimiento: true, fallecimientoAccidental: false, invalidezTotal: true, enfermedadesGraves: false },
  },
  {
    id: 'integral',
    label: 'Protección Integral',
    coverages: { fallecimiento: true, fallecimientoAccidental: true, invalidezTotal: true, enfermedadesGraves: true },
  },
]

export function findProtectionType(id: ProtectionType): ProtectionTypeDef {
  const found = PROTECTION_TYPES.find((p) => p.id === id)
  if (!found) throw new Error(`Tipo de protección desconocido: ${id}`)
  return found
}

export interface AgeBand {
  id: string
  label: string
  min: number
  max: number
}

/** Rangos de edad de referencia (sección 2) — solo para mostrarle a la asesora en qué categoría cae el cliente; la tarifa real se busca por edad exacta primero. */
export const AGE_BANDS: AgeBand[] = [
  { id: '18-24', label: '18 a 24 años', min: 18, max: 24 },
  { id: '25-29', label: '25 a 29 años', min: 25, max: 29 },
  { id: '30-35', label: '30 a 35 años', min: 30, max: 35 },
  { id: '36-40', label: '36 a 40 años', min: 36, max: 40 },
  { id: '41-50', label: '41 a 50 años', min: 41, max: 50 },
  { id: '51-55', label: '51 a 55 años', min: 51, max: 55 },
  { id: '56-60', label: '56 a 60 años', min: 56, max: 60 },
]

/** Encuentra la banda de edad de referencia para mostrarla junto a la edad exacta. Null si la edad está fuera de 18-60. */
export function findAgeBand(age: number): AgeBand | null {
  return AGE_BANDS.find((b) => age >= b.min && age <= b.max) ?? null
}

/** Períodos de cobertura sugeridos (sección 5) — el formulario de tarifas acepta cualquier número de años; estos son solo las opciones iniciales que siempre aparecen en el selector. */
export const DEFAULT_COVERAGE_PERIODS = [10, 13, 15, 17]
