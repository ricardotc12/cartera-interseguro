import type { RangeRule } from '@/types/domain'

/**
 * Finds the tier whose [min, max] range contains `value`. `max === null` means
 * unbounded above ("en adelante"). Returns null when no configured rule covers
 * the value — callers must surface this as a warning, never assume a default.
 */
export function findRangeMatch<T extends RangeRule>(value: number, rules: T[]): T | null {
  const match = rules.find((rule) => value >= rule.min && (rule.max === null || value <= rule.max))
  return match ?? null
}

/**
 * Encuentra el tramo inmediatamente superior al que cubre `value` (para alertas
 * del tipo "si alcanzas X, tu factor sube a Y" — sección 31). Null si `value`
 * no cae en ningún tramo o ya está en el tramo más alto configurado.
 */
export function findNextTier<T extends RangeRule>(value: number, rules: T[]): T | null {
  const sorted = [...rules].sort((a, b) => a.min - b.min)
  const currentIndex = sorted.findIndex((rule) => value >= rule.min && (rule.max === null || value <= rule.max))
  if (currentIndex === -1 || currentIndex === sorted.length - 1) return null
  return sorted[currentIndex + 1] ?? null
}
