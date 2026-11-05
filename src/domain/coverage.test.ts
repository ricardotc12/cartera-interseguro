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
  it('suma todas las coberturas marcadas, obligatorias y adicionales', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 50 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 30 },
      { coverageCode: 'fallecimiento_accidente' as const, amount: 20 },
    ]
    expect(calculateCollectionAmount(coverages)).toBe(100)
  })

  it('es igual a calculateEmissionAmount cuando solo hay obligatorias', () => {
    const coverages = [
      { coverageCode: 'fallecimiento' as const, amount: 50 },
      { coverageCode: 'invalidez_total_adelanto_capital' as const, amount: 30 },
    ]
    expect(calculateCollectionAmount(coverages)).toBe(calculateEmissionAmount(coverages))
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
