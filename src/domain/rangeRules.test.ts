import { describe, it, expect } from 'vitest'
import { findNextTier, findRangeMatch } from './rangeRules'
import type { CollectionFactorRule } from '@/types/domain'

const rules: CollectionFactorRule[] = [
  { id: '1', periodId: 'p', min: 0, max: 64.99, sortOrder: 1, factor: 0 },
  { id: '2', periodId: 'p', min: 65.0, max: 77.99, sortOrder: 2, factor: 0.5 },
  { id: '3', periodId: 'p', min: 78.0, max: 82.99, sortOrder: 3, factor: 0.75 },
  { id: '4', periodId: 'p', min: 83.0, max: 85.99, sortOrder: 4, factor: 0.85 },
  { id: '5', periodId: 'p', min: 86.0, max: null, sortOrder: 5, factor: 1.0 },
]

describe('findNextTier (sección 31)', () => {
  it('84% (factor 0.85) → el siguiente tramo es 86% con factor 1.00', () => {
    expect(findNextTier(84, rules)?.factor).toBe(1.0)
    expect(findNextTier(84, rules)?.min).toBe(86.0)
  })

  it('devuelve null cuando ya está en el tramo más alto', () => {
    expect(findNextTier(95, rules)).toBeNull()
  })

  it('devuelve null cuando el valor no cae en ningún tramo', () => {
    expect(findNextTier(-5, rules)).toBeNull()
  })
})

describe('findRangeMatch', () => {
  it('encuentra el tramo cuyo rango [min, max] contiene el valor', () => {
    expect(findRangeMatch(70, rules)?.factor).toBe(0.5)
  })

  it('un tramo con max null no tiene límite superior ("en adelante")', () => {
    expect(findRangeMatch(1000, rules)?.factor).toBe(1.0)
  })

  it('devuelve null si el valor es negativo y ningún tramo lo cubre', () => {
    expect(findRangeMatch(-1, rules)).toBeNull()
  })

  it('devuelve null con una lista de reglas vacía, sin inventar un tramo', () => {
    expect(findRangeMatch(50, [])).toBeNull()
  })
})
