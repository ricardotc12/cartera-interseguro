import { describe, it, expect } from 'vitest'
import { calculateIncentivePercentage, calculateBaseIncentive, calculateFinalIncentive } from './incentive'
import { calculateVidaEmission } from './vidaEmission'
import type { IncentiveRule } from '@/types/domain'

const rules: IncentiveRule[] = [
  { id: '1', periodId: 'p', min: 8500, max: 11798.99, sortOrder: 1, percentage: 0.13 },
  { id: '2', periodId: 'p', min: 11799.0, max: 13998.99, sortOrder: 2, percentage: 0.22 },
  { id: '3', periodId: 'p', min: 13999.0, max: null, sortOrder: 3, percentage: 0.26 },
]

describe('calculateIncentivePercentage (sección 24 y 34)', () => {
  it.each([
    [11798.99, 0.13],
    [11799.0, 0.22],
    [13998.99, 0.22],
    [13999.0, 0.26],
    [20000, 0.26],
  ])('emisión %s => %s%% de incentivo', (vidaEmission, expected) => {
    expect(calculateIncentivePercentage(vidaEmission, rules)).toBe(expected)
  })

  it('devuelve null cuando la emisión no cae en ningún tramo configurado', () => {
    expect(calculateIncentivePercentage(1000, rules)).toBeNull()
  })
})

describe('calculateVidaEmission (REGLA 1, sección 18)', () => {
  it('S/300 × 10 = S/3,000', () => {
    expect(calculateVidaEmission(300, 10)).toBe(3000)
  })
})

describe('Ejemplos de la sección 25 (Incentivo Base)', () => {
  it.each([
    [10000, 0.13, 1300],
    [12000, 0.22, 2640],
    [15000, 0.26, 3900],
  ])('emisión %s × %s = %s', (vidaEmission, pct, expected) => {
    expect(calculateBaseIncentive(vidaEmission, pct)).toBeCloseTo(expected, 8)
  })
})

describe('Ejemplo completo de la sección 26/40 (Incentivo Final)', () => {
  it('Emisión 15,000 → 26% → base 3,900 → factor cobranza 0.85 → factor ICV 1 → final 3,315', () => {
    const vidaEmission = calculateVidaEmission(1500, 10)
    const pct = calculateIncentivePercentage(vidaEmission, rules)
    expect(pct).toBe(0.26)
    const base = calculateBaseIncentive(vidaEmission, pct!)
    expect(base).toBe(3900)
    const final = calculateFinalIncentive(base, 0.85, 1)
    expect(final).toBe(3315)
  })
})
