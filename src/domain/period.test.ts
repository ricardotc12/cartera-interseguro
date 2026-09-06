import { describe, it, expect } from 'vitest'
import { calculatePeriodForDate, calculateDaysUntil } from './period'
import type { IncentivePeriod } from '@/types/domain'

const basePeriod = (overrides: Partial<IncentivePeriod>): IncentivePeriod => ({
  id: 'p1',
  name: 'Período',
  startDate: '2026-08-16',
  endDate: '2026-09-15',
  status: 'active',
  vidaEmissionGoal: 13999,
  vidaEmissionMultiplier: 10,
  icvGoal: null,
  collectionGoal: null,
  notes: null,
  ...overrides,
})

describe('calculatePeriodForDate', () => {
  const periodA = basePeriod({ id: 'A', startDate: '2026-08-16', endDate: '2026-09-15' })
  const periodB = basePeriod({ id: 'B', startDate: '2026-09-16', endDate: '2026-10-15' })
  const periods = [periodA, periodB]

  it('15/08/2026 no pertenece a ningún período (un día antes del inicio de A)', () => {
    expect(calculatePeriodForDate('2026-08-15', periods)).toBeNull()
  })

  it('16/08/2026 pertenece al período A (límite inferior inclusivo)', () => {
    expect(calculatePeriodForDate('2026-08-16', periods)?.id).toBe('A')
  })

  it('15/09/2026 pertenece al período A (límite superior inclusivo)', () => {
    expect(calculatePeriodForDate('2026-09-15', periods)?.id).toBe('A')
  })

  it('16/09/2026 pertenece al período B, no al A', () => {
    expect(calculatePeriodForDate('2026-09-16', periods)?.id).toBe('B')
  })

  it('devuelve null si no hay ningún período configurado que cubra la fecha', () => {
    expect(calculatePeriodForDate('2027-01-01', periods)).toBeNull()
  })
})

describe('calculateDaysUntil (sección 45)', () => {
  it('5 días antes de que termine el período', () => {
    expect(calculateDaysUntil('2026-09-15', '2026-09-10')).toBe(5)
  })

  it('0 cuando la fecha objetivo es hoy', () => {
    expect(calculateDaysUntil('2026-09-15', '2026-09-15')).toBe(0)
  })

  it('negativo cuando la fecha objetivo ya pasó', () => {
    expect(calculateDaysUntil('2026-09-15', '2026-09-20')).toBe(-5)
  })
})
