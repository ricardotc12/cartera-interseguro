import { describe, expect, it } from 'vitest'
import { calculateDaysActive, calculateTenureMonths } from './policy'

describe('calculateDaysActive', () => {
  it('calcula los días entre emisión y cancelación', () => {
    expect(calculateDaysActive('2026-01-01', '2026-01-31')).toBe(30)
  })

  it('devuelve null si no hay fecha de cancelación', () => {
    expect(calculateDaysActive('2026-01-01', null)).toBeNull()
  })
})

describe('calculateTenureMonths', () => {
  it('calcula meses completos entre dos fechas', () => {
    expect(calculateTenureMonths('2025-01-15', '2025-08-15')).toBe(7)
    expect(calculateTenureMonths('2025-01-15', '2025-08-14')).toBe(6)
    expect(calculateTenureMonths('2025-01-15', '2025-08-16')).toBe(7)
  })

  it('nunca devuelve un valor negativo', () => {
    expect(calculateTenureMonths('2025-06-01', '2025-01-01')).toBe(0)
  })
})
