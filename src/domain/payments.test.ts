import { describe, it, expect } from 'vitest'
import { generateOwedMonths, calculateDaysOverdue } from './payments'

describe('generateOwedMonths (sección 19)', () => {
  it('un afiliado que ingresó en junio debe pagos de junio a septiembre (mes de referencia)', () => {
    expect(generateOwedMonths('2026-06-15', '2026-09-04')).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
    ])
  })

  it('un afiliado que ingresó en septiembre solo debe septiembre en adelante, no meses previos', () => {
    expect(generateOwedMonths('2026-09-10', '2026-09-30')).toEqual(['2026-09-01'])
  })

  it('cruza el fin de año correctamente', () => {
    expect(generateOwedMonths('2025-11-10', '2026-02-01')).toEqual([
      '2025-11-01',
      '2025-12-01',
      '2026-01-01',
      '2026-02-01',
    ])
  })

  it('devuelve vacío si la póliza inicia después de la fecha de referencia', () => {
    expect(generateOwedMonths('2026-12-01', '2026-09-04')).toEqual([])
  })
})

describe('calculateDaysOverdue (sección 20)', () => {
  it('devuelve null si no hay fecha de vencimiento registrada', () => {
    expect(calculateDaysOverdue(null, '2026-09-04')).toBeNull()
  })

  it('devuelve null si todavía no vence', () => {
    expect(calculateDaysOverdue('2026-09-10', '2026-09-04')).toBeNull()
  })

  it('calcula los días de atraso cuando ya venció', () => {
    expect(calculateDaysOverdue('2026-08-25', '2026-09-04')).toBe(10)
  })
})
