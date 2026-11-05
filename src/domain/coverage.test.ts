import { describe, expect, it } from 'vitest'
import { calculateCollectionAmount, calculateEmissionAmount, modalidadStepMonths } from './coverage'

describe('calculateEmissionAmount', () => {
  it('suma solo las coberturas obligatorias', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 50 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 30 },
      { coverageCode: 'fallecimiento_accidente' as const, amount: 20 },
    ]
    expect(calculateEmissionAmount(coverages)).toBe(80)
  })

  it('devuelve 0 si no hay coberturas', () => {
    expect(calculateEmissionAmount([])).toBe(0)
  })
})

describe('calculateCollectionAmount', () => {
  it('suma todas las coberturas marcadas (obligatorias y adicionales) y divide entre 10', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 50 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 30 },
      { coverageCode: 'fallecimiento_accidente' as const, amount: 20 },
    ]
    expect(calculateCollectionAmount(coverages)).toBe(10)
  })

  it('con el caso real reportado: 19944.90 en coberturas obligatorias da 1994.49 de cobranza', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 12000 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 7944.9 },
    ]
    expect(calculateCollectionAmount(coverages)).toBeCloseTo(1994.49, 5)
  })

  it('ya no es igual a calculateEmissionAmount cuando solo hay obligatorias (queda dividido entre 10)', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 50 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 30 },
    ]
    expect(calculateCollectionAmount(coverages)).toBe(8)
    expect(calculateEmissionAmount(coverages)).toBe(80)
  })

  it('devuelve 0 si no hay coberturas', () => {
    expect(calculateCollectionAmount([])).toBe(0)
  })
})

describe('modalidadStepMonths', () => {
  it('mapea cada modalidad a su cantidad de meses', () => {
    expect(modalidadStepMonths('mensual')).toBe(1)
    expect(modalidadStepMonths('trimestral')).toBe(3)
    expect(modalidadStepMonths('semestral')).toBe(6)
    expect(modalidadStepMonths('anual')).toBe(12)
  })
})
