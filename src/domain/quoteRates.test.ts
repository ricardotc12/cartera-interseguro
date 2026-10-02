import { describe, it, expect } from 'vitest'
import { findQuoteRate, type QuoteRate } from './quoteRates'

const baseFilters = { product: 'Vida Free', plan: 'Vida Free', protectionType: 'integral' as const, coverageYears: 15 }

const rangeRate: QuoteRate = {
  id: 'range',
  ageMin: 30,
  ageMax: 35,
  product: 'Vida Free',
  plan: 'Vida Free',
  protectionType: 'integral',
  coverageYears: 15,
  primaMensual: 190,
  primaAnual: 2090,
  montoAsegurado: 150000,
  pctDevolucion: 1,
  totalDevolucion: 31350,
  notes: null,
}

const exactAgeRate: QuoteRate = { ...rangeRate, id: 'exact', ageMin: 32, ageMax: 32, primaMensual: 210 }

describe('findQuoteRate', () => {
  it('encuentra la tarifa por rango cuando no hay una de edad exacta', () => {
    const result = findQuoteRate([rangeRate], { ...baseFilters, age: 33 })
    expect(result?.id).toBe('range')
  })

  it('una fila de edad exacta (ageMin === ageMax) tiene prioridad sobre el rango más amplio', () => {
    const result = findQuoteRate([rangeRate, exactAgeRate], { ...baseFilters, age: 32 })
    expect(result?.id).toBe('exact')
    expect(result?.primaMensual).toBe(210)
  })

  it('fuera del rango de edad exacta, cae de nuevo al rango general', () => {
    const result = findQuoteRate([rangeRate, exactAgeRate], { ...baseFilters, age: 31 })
    expect(result?.id).toBe('range')
  })

  it('no encuentra nada si el producto/plan no coincide, sin inventar una tarifa', () => {
    const result = findQuoteRate([rangeRate], { ...baseFilters, age: 33, product: 'Otro producto' })
    expect(result).toBeNull()
  })

  it('no encuentra nada si el período de cobertura no coincide', () => {
    const result = findQuoteRate([rangeRate], { ...baseFilters, age: 33, coverageYears: 10 })
    expect(result).toBeNull()
  })

  it('devuelve null con una lista de tarifas vacía', () => {
    expect(findQuoteRate([], { ...baseFilters, age: 33 })).toBeNull()
  })
})
