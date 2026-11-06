import { describe, it, expect } from 'vitest'
import {
  generateOwedMonths,
  effectiveFirstOwedMonth,
  hasManualFirstPayment,
  calculateDaysOverdue,
  defaultDueDateForMonth,
  effectiveDueDate,
  getDisplayPaymentStatus,
} from './payments'

describe('generateOwedMonths (sección 19)', () => {
  it('un afiliado que ingresó en junio debe verse de junio a diciembre del año en curso, no solo hasta hoy', () => {
    expect(generateOwedMonths('2026-06-15', '2026-09-04')).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ])
  })

  it('un afiliado que ingresó en septiembre debe septiembre a diciembre, no meses previos ni de años futuros', () => {
    expect(generateOwedMonths('2026-09-10', '2026-09-30')).toEqual(['2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01'])
  })

  it('cruza el fin de año correctamente, completando diciembre del año de referencia', () => {
    expect(generateOwedMonths('2025-11-10', '2026-02-01')).toEqual([
      '2025-11-01',
      '2025-12-01',
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ])
  })

  it('al empezar un año nuevo, una póliza vigente desde antes muestra los 12 meses de ese año', () => {
    const result = generateOwedMonths('2025-06-01', '2027-01-05')
    expect(result[result.length - 1]).toBe('2027-12-01')
    expect(result.filter((m) => m.startsWith('2027-'))).toEqual(
      Array.from({ length: 12 }, (_, i) => `2027-${String(i + 1).padStart(2, '0')}-01`),
    )
  })

  it('una póliza que arranca el propio 1 de enero del año de referencia ya ve sus 12 meses', () => {
    expect(generateOwedMonths('2027-01-01', '2027-01-05')).toEqual(
      Array.from({ length: 12 }, (_, i) => `2027-${String(i + 1).padStart(2, '0')}-01`),
    )
  })

  it('devuelve vacío si la póliza inicia en un año posterior al de la fecha de referencia', () => {
    expect(generateOwedMonths('2027-03-01', '2026-09-04')).toEqual([])
  })

  it('modalidad trimestral (stepMonths=3): genera una cuota cada 3 meses desde la emisión', () => {
    expect(generateOwedMonths('2026-01-10', '2026-09-04', 3)).toEqual(['2026-01-01', '2026-04-01', '2026-07-01', '2026-10-01'])
  })

  it('modalidad anual (stepMonths=12) cruzando fin de año: una sola cuota por año de referencia', () => {
    expect(generateOwedMonths('2025-05-01', '2027-01-01', 12)).toEqual(['2025-05-01', '2026-05-01', '2027-05-01'])
  })
})

describe('effectiveFirstOwedMonth (corte de débito automático)', () => {
  it('emisión el día 1: la primera cuota cae ese mismo mes (01/09 -> corte 20/09)', () => {
    expect(effectiveFirstOwedMonth('2026-09-01')).toBe('2026-09-01')
  })

  it('emisión el día 2 en adelante: la primera cuota recién cae el mes siguiente (02/10 -> corte 20/11)', () => {
    expect(effectiveFirstOwedMonth('2026-10-02')).toBe('2026-11-01')
  })

  it('emisión a fin de mes también corre al mes siguiente (30/09 -> corte 20/10)', () => {
    expect(effectiveFirstOwedMonth('2026-09-30')).toBe('2026-10-01')
  })

  it('cruza el fin de año (02/12 -> corte 20/01 del año siguiente)', () => {
    expect(effectiveFirstOwedMonth('2026-12-02')).toBe('2027-01-01')
  })

  it('emisión el día 1 de diciembre no cruza de año (01/12 -> corte 20/12)', () => {
    expect(effectiveFirstOwedMonth('2026-12-01')).toBe('2026-12-01')
  })
})

describe('hasManualFirstPayment (cuota que la asesora cobra ella misma al afiliar)', () => {
  it('emisión el día 1: el débito automático ya cobra ese mismo mes, no hace falta cuota manual aparte', () => {
    expect(hasManualFirstPayment('2026-09-01')).toBe(false)
  })

  it('emisión del día 2 en adelante: sí hay una cuota manual adicional en el mes de emisión', () => {
    expect(hasManualFirstPayment('2026-10-02')).toBe(true)
    expect(hasManualFirstPayment('2026-09-30')).toBe(true)
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

describe('defaultDueDateForMonth', () => {
  it('usa el día 20 del mismo mes de cobranza como fecha de corte', () => {
    expect(defaultDueDateForMonth('2026-09-01')).toBe('2026-09-20')
    expect(defaultDueDateForMonth('2027-01-01')).toBe('2027-01-20')
  })
})

describe('effectiveDueDate', () => {
  it('usa la fecha registrada si existe', () => {
    expect(effectiveDueDate('2026-09-01', '2026-09-20')).toBe('2026-09-20')
  })

  it('usa el día 20 por defecto si el pago no tiene fecha de vencimiento registrada', () => {
    expect(effectiveDueDate('2026-09-01', null)).toBe('2026-09-20')
  })
})

describe('getDisplayPaymentStatus', () => {
  it('un mes "no_pagado" con varios días de anticipación se muestra como "al_dia"', () => {
    expect(getDisplayPaymentStatus('no_pagado', '2026-09-20', '2026-09-10')).toBe('al_dia')
    expect(getDisplayPaymentStatus('no_pagado', '2026-09-20', '2026-09-18')).toBe('al_dia')
  })

  it('un día antes del vencimiento pasa a mostrarse como "pendiente"', () => {
    expect(getDisplayPaymentStatus('no_pagado', '2026-09-20', '2026-09-19')).toBe('pendiente')
  })

  it('el mismo día del vencimiento todavía se muestra como "pendiente" (inclusive)', () => {
    expect(getDisplayPaymentStatus('no_pagado', '2026-09-20', '2026-09-20')).toBe('pendiente')
  })

  it('un mes "no_pagado" después de su vencimiento se muestra como "no_pagado"', () => {
    expect(getDisplayPaymentStatus('no_pagado', '2026-09-20', '2026-09-21')).toBe('no_pagado')
  })

  it('sin fecha de vencimiento registrada, se muestra el estado real tal cual', () => {
    expect(getDisplayPaymentStatus('no_pagado', null, '2026-09-16')).toBe('no_pagado')
  })

  it('los demás estados se muestran tal cual, sin depender de la fecha', () => {
    expect(getDisplayPaymentStatus('pagado', '2026-09-20', '2026-09-10')).toBe('pagado')
    expect(getDisplayPaymentStatus('pendiente_confirmar', '2026-09-20', '2026-09-10')).toBe('pendiente_confirmar')
    expect(getDisplayPaymentStatus('no_corresponde', '2026-09-20', '2026-09-10')).toBe('no_corresponde')
  })
})
