import { describe, it, expect } from 'vitest'
import { findIncentiveTier, calculateBaseIncentive, calculateFinalIncentive } from './incentive'
import { calculateVidaEmission } from './vidaEmission'
import type { IncentiveRule } from '@/types/domain'

// Refleja el esquema real vigente (imagen de Interseguro): los tramos más bajos
// son un monto fijo en soles, y solo el tramo más alto es un porcentaje real.
const rules: IncentiveRule[] = [
  { id: '1', periodId: 'p', min: 8500, max: 11299.99, sortOrder: 1, valueType: 'fixed', fixedAmount: 1300, percentage: null },
  { id: '2', periodId: 'p', min: 11300, max: 13499.99, sortOrder: 2, valueType: 'fixed', fixedAmount: 2500, percentage: null },
  { id: '3', periodId: 'p', min: 13500, max: 15799.99, sortOrder: 3, valueType: 'fixed', fixedAmount: 3400, percentage: null },
  { id: '4', periodId: 'p', min: 15800, max: null, sortOrder: 4, valueType: 'percentage', percentage: 0.26, fixedAmount: null },
]

describe('findIncentiveTier (sección 24 y 34)', () => {
  it.each([
    [8500, 'fixed', 1300],
    [11299.99, 'fixed', 1300],
    [11300, 'fixed', 2500],
    [15799.99, 'fixed', 3400],
    [15800, 'percentage', 0.26],
    [20000, 'percentage', 0.26],
  ])('emisión %s cae en un tramo %s con valor %s', (vidaEmission, valueType, value) => {
    const tier = findIncentiveTier(vidaEmission as number, rules)
    expect(tier?.valueType).toBe(valueType)
    expect(valueType === 'fixed' ? tier?.fixedAmount : tier?.percentage).toBe(value)
  })

  it('devuelve null cuando la emisión no cae en ningún tramo configurado', () => {
    expect(findIncentiveTier(1000, rules)).toBeNull()
  })
})

describe('calculateVidaEmission (REGLA 1, sección 18)', () => {
  it('S/300 × 10 = S/3,000', () => {
    expect(calculateVidaEmission(300, 10)).toBe(3000)
  })
})

describe('calculateBaseIncentive — tramo de monto fijo', () => {
  it('el Incentivo Base es el monto fijo del tramo, sin multiplicar por la Emisión Vida', () => {
    const tier = findIncentiveTier(9000, rules)!
    expect(calculateBaseIncentive(9000, tier)).toBe(1300)
  })
})

describe('calculateBaseIncentive — tramo de porcentaje (sección 25)', () => {
  it.each([
    [16000, 0.26, 4160],
    [20000, 0.26, 5200],
  ])('emisión %s × %s = %s', (vidaEmission, pct, expected) => {
    const tier: IncentiveRule = { id: 't', periodId: 'p', min: 0, max: null, sortOrder: 1, valueType: 'percentage', percentage: pct, fixedAmount: null }
    expect(calculateBaseIncentive(vidaEmission, tier)).toBeCloseTo(expected, 8)
  })
})

describe('Ejemplo completo de la sección 26/40 (Incentivo Final)', () => {
  it('Emisión 20,000 → tramo 26% → base 5,200 → factor cobranza 0.85 → factor ICV 1 → final 4,420', () => {
    const vidaEmission = calculateVidaEmission(2000, 10)
    const tier = findIncentiveTier(vidaEmission, rules)
    expect(tier?.valueType).toBe('percentage')
    const base = calculateBaseIncentive(vidaEmission, tier!)
    expect(base).toBe(5200)
    const final = calculateFinalIncentive(base, 0.85, 1)
    expect(final).toBe(4420)
  })
})
