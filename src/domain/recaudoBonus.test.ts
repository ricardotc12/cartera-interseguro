import { describe, expect, it } from 'vitest'
import { calculateRecaudoBonus, calculateRecaudoBonusBase, isEligibleForRecaudoBonus } from './recaudoBonus'

describe('calculateRecaudoBonusBase', () => {
  const referenceDate = '2026-11-01'

  it('suma solo pagos "pagado" de pólizas con hasta 18 meses de antigüedad', () => {
    const payments = [
      { status: 'pagado' as const, paidAmount: 100, policyStartDate: '2026-01-01' }, // 10 meses, cuenta
      { status: 'pagado' as const, paidAmount: 200, policyStartDate: '2024-01-01' }, // 34 meses, no cuenta
      { status: 'no_pagado' as const, paidAmount: null, policyStartDate: '2026-01-01' }, // no pagado, no cuenta
    ]
    expect(calculateRecaudoBonusBase(payments, referenceDate)).toBe(100)
  })

  it('devuelve 0 si no hay pagos que califiquen', () => {
    expect(calculateRecaudoBonusBase([], referenceDate)).toBe(0)
  })
})

describe('calculateRecaudoBonus', () => {
  it('aplica la tasa del 12% por defecto', () => {
    expect(calculateRecaudoBonus(1000)).toBe(120)
  })
})

describe('isEligibleForRecaudoBonus', () => {
  it('no califica con menos de 7 meses de antigüedad del agente', () => {
    expect(isEligibleForRecaudoBonus(6, 50000, 1000)).toBe(false)
  })

  it('no califica si no hay tramo configurado', () => {
    expect(isEligibleForRecaudoBonus(12, 50000, null)).toBe(false)
  })

  it('no califica si la Emisión Vida no alcanza la primera banda', () => {
    expect(isEligibleForRecaudoBonus(12, 500, 1000)).toBe(false)
  })

  it('califica con antigüedad suficiente y la primera banda alcanzada', () => {
    expect(isEligibleForRecaudoBonus(7, 1000, 1000)).toBe(true)
  })
})
