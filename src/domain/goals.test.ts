import { describe, it, expect } from 'vitest'
import { calculateGoalProgress } from './goals'

describe('calculateGoalProgress (sección 28 y ejemplo 40)', () => {
  it('emisión 15,000 sobre meta 13,999 => 107.15% de cumplimiento, sin faltante', () => {
    const progress = calculateGoalProgress(13999, 15000)
    expect(progress.compliancePct).toBeCloseTo(1.0715, 4)
    expect(progress.remaining).toBe(0)
  })

  it('cuando no se alcanza la meta, calcula el monto faltante', () => {
    const progress = calculateGoalProgress(10000, 6000)
    expect(progress.remaining).toBe(4000)
    expect(progress.compliancePct).toBeCloseTo(0.6, 4)
  })

  it('meta 0 no produce división por cero', () => {
    expect(calculateGoalProgress(0, 500).compliancePct).toBe(0)
  })
})
