import { describe, it, expect } from 'vitest'
import { findAgeBand, findProtectionType, AGE_BANDS } from './quoteCoverage'

describe('findAgeBand', () => {
  it('32 años cae en el rango 30-35', () => {
    expect(findAgeBand(32)?.id).toBe('30-35')
  })

  it('los límites de cada rango son inclusivos', () => {
    expect(findAgeBand(18)?.id).toBe('18-24')
    expect(findAgeBand(60)?.id).toBe('56-60')
  })

  it('devuelve null fuera de 18-60, sin inventar un rango', () => {
    expect(findAgeBand(17)).toBeNull()
    expect(findAgeBand(61)).toBeNull()
  })

  it('los 7 rangos no se solapan ni dejan huecos entre 18 y 60', () => {
    const sorted = [...AGE_BANDS].sort((a, b) => a.min - b.min)
    expect(sorted[0]!.min).toBe(18)
    expect(sorted[sorted.length - 1]!.max).toBe(60)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.min).toBe(sorted[i - 1]!.max + 1)
    }
  })
})

describe('findProtectionType', () => {
  it('Protección Básica cubre fallecimiento y fallecimiento accidental, nada más', () => {
    const t = findProtectionType('basica')
    expect(t.coverages).toEqual({ fallecimiento: true, fallecimientoAccidental: true, invalidezTotal: false, enfermedadesGraves: false })
  })

  it('Protección + Invalidez cubre fallecimiento e invalidez total, no fallecimiento accidental', () => {
    const t = findProtectionType('invalidez')
    expect(t.coverages).toEqual({ fallecimiento: true, fallecimientoAccidental: false, invalidezTotal: true, enfermedadesGraves: false })
  })

  it('Protección Integral cubre las 4', () => {
    const t = findProtectionType('integral')
    expect(t.coverages).toEqual({ fallecimiento: true, fallecimientoAccidental: true, invalidezTotal: true, enfermedadesGraves: true })
  })
})
