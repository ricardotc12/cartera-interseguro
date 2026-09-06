import { describe, it, expect } from 'vitest'
import { calculateCollectionRatio, calculateCollectionFactor } from './collection'
import type { CollectionFactorRule, Payment } from '@/types/domain'

const rules: CollectionFactorRule[] = [
  { id: '1', periodId: 'p', min: 0, max: 64.99, sortOrder: 1, factor: 0 },
  { id: '2', periodId: 'p', min: 65.0, max: 77.99, sortOrder: 2, factor: 0.5 },
  { id: '3', periodId: 'p', min: 78.0, max: 82.99, sortOrder: 3, factor: 0.75 },
  { id: '4', periodId: 'p', min: 83.0, max: 85.99, sortOrder: 4, factor: 0.85 },
  { id: '5', periodId: 'p', min: 86.0, max: null, sortOrder: 5, factor: 1.0 },
]

describe('calculateCollectionFactor (sección 34)', () => {
  it.each([
    [0, 0],
    [64.99, 0],
    [65.0, 0.5],
    [77.99, 0.5],
    [78.0, 0.75],
    [82.99, 0.75],
    [83.0, 0.85],
    [85.99, 0.85],
    [86.0, 1.0],
    [95, 1.0],
  ])('ratio %s%% => factor %s', (ratio, expected) => {
    expect(calculateCollectionFactor(ratio, rules)).toBe(expected)
  })
})

const payment = (overrides: Partial<Payment>): Payment => ({
  id: 'x',
  policyId: 'pol1',
  yearMonth: '2026-08-01',
  expectedAmount: 100,
  paidAmount: 100,
  paymentDate: null,
  status: 'pagado',
  isRescheduled: false,
  paymentMethod: null,
  operationNumber: null,
  dueDate: null,
  observation: null,
  ...overrides,
})

describe('calculateCollectionRatio (REGLA 4 y REGLA 5)', () => {
  it('calcula el ratio como cobrado/por-cobrar en %', () => {
    const payments = [payment({ expectedAmount: 100, paidAmount: 84 })]
    expect(calculateCollectionRatio(payments)).toBe(84)
  })

  it('excluye las primas reprogramadas del numerador y del denominador', () => {
    const payments = [
      payment({ expectedAmount: 100, paidAmount: 100 }),
      payment({ id: 'y', expectedAmount: 1000, paidAmount: 0, isRescheduled: true }),
    ]
    expect(calculateCollectionRatio(payments)).toBe(100)
  })

  it('devuelve null si no hay primas por cobrar (evita dividir por cero)', () => {
    expect(calculateCollectionRatio([])).toBeNull()
  })
})
