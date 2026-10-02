import type { ProtectionType, QuoteRate } from '@/types/domain'

export type { QuoteRate }

export interface QuoteFilters {
  age: number
  product: string
  plan: string
  protectionType: ProtectionType
  coverageYears: number
}

/**
 * Busca la tarifa que corresponde a una combinación exacta de producto/plan/protección/período
 * para una edad dada. Una fila con ageMin === ageMax (edad exacta) es, en los hechos, el rango
 * más angosto posible — por eso alcanza con una sola regla ("rango más angosto gana") para que
 * una tarifa específica por edad exacta tenga prioridad sobre una más general por rango
 * (sección 3: "Cliente A: 30 años, Cliente B: 35 años... sus valores podrían ser diferentes").
 * Devuelve null si ninguna tarifa registrada cubre esa combinación — nunca se inventa un valor.
 */
export function findQuoteRate(rates: QuoteRate[], filters: QuoteFilters): QuoteRate | null {
  const candidates = rates.filter(
    (r) =>
      filters.age >= r.ageMin &&
      filters.age <= r.ageMax &&
      r.product === filters.product &&
      r.plan === filters.plan &&
      r.protectionType === filters.protectionType &&
      r.coverageYears === filters.coverageYears,
  )
  if (candidates.length === 0) return null

  return candidates.reduce((narrowest, candidate) =>
    candidate.ageMax - candidate.ageMin < narrowest.ageMax - narrowest.ageMin ? candidate : narrowest,
  )
}
