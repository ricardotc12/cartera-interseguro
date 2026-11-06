import { describe, it, expect } from 'vitest'
import { calculateICVFactor, qualifiesForIcv } from './icv'
import type { IcvFactorRule } from '@/types/domain'

describe('calculateICVFactor (sección 23 y 34)', () => {
  const periodoUno: IcvFactorRule[] = [
    { id: '1', periodId: 'p1', min: 0, max: 69.99, sortOrder: 1, factor: 0 },
    { id: '2', periodId: 'p1', min: 70.0, max: 100, sortOrder: 2, factor: 1 },
  ]

  const periodoDos: IcvFactorRule[] = [
    { id: '1', periodId: 'p2', min: 0, max: 74.99, sortOrder: 1, factor: 0 },
    { id: '2', periodId: 'p2', min: 75.0, max: 100, sortOrder: 2, factor: 1 },
  ]

  it('período 16/03-15/08: 69.99% => factor 0, 70% => factor 1', () => {
    expect(calculateICVFactor(69.99, periodoUno)).toBe(0)
    expect(calculateICVFactor(70.0, periodoUno)).toBe(1)
  })

  it('período 16/08-15/01: 74.99% => factor 0, 75% => factor 1 (septiembre 2026 usa este período)', () => {
    expect(calculateICVFactor(74.99, periodoDos)).toBe(0)
    expect(calculateICVFactor(75.0, periodoDos)).toBe(1)
  })

  it('devuelve null si ningún tramo cubre el valor', () => {
    expect(calculateICVFactor(150, periodoDos)).toBeNull()
  })
})

describe('qualifiesForIcv', () => {
  it('una póliza activa siempre cuenta, sin importar cuánto tiempo lleva', () => {
    expect(qualifiesForIcv('activo', '2020-01-01', '2026-11-01')).toBe(true)
  })

  it('una póliza anulada cuenta dentro de los primeros 12 meses desde su emisión', () => {
    expect(qualifiesForIcv('cancelado', '2026-01-15', '2026-09-01')).toBe(true)
  })

  it('una póliza anulada deja de contar pasado el año desde su emisión', () => {
    expect(qualifiesForIcv('cancelado', '2026-01-15', '2027-02-01')).toBe(false)
  })

  it('no cuenta la cuota manual del mes de emisión cuando la afiliación fue del día 2 en adelante', () => {
    expect(qualifiesForIcv('activo', '2026-07-02', '2026-07-01')).toBe(false)
  })

  it('sí cuenta la cuota del mes de emisión cuando la afiliación fue el día 1 (la cobra el débito automático)', () => {
    expect(qualifiesForIcv('activo', '2026-07-01', '2026-07-01')).toBe(true)
  })

  it('cuenta normal las cuotas de meses posteriores al de emisión', () => {
    expect(qualifiesForIcv('activo', '2026-07-02', '2026-08-01')).toBe(true)
  })
})
