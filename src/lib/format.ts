const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
const monthYearFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

/** Equivalente aproximado en dólares de un monto en soles, dado el tipo de cambio (dólares por sol) de `useUsdRate`. */
export function formatUsdApprox(amountInPen: number, usdPerPen: number): string {
  return `≈ ${usdFormatter.format(amountInPen * usdPerPen)}`
}

export function formatPercentage(fraction: number, decimals = 2): string {
  return `${(fraction * 100).toFixed(decimals)}%`
}

/** Valor de un tramo de incentivo tal como corresponde mostrarlo: "26%" si es porcentaje, "S/ 1,300.00" si es monto fijo. */
export function formatIncentiveTierValue(
  tier: { valueType: 'percentage' | 'fixed'; percentage: number | null; fixedAmount: number | null } | null,
): string {
  if (!tier) return '—'
  return tier.valueType === 'fixed' ? formatCurrency(tier.fixedAmount as number) : formatPercentage(tier.percentage as number, 0)
}

/** Formatea un porcentaje ya expresado en puntos (0-100), como los ratios de cobranza/ICV. */
export function formatPoints(points: number, decimals = 2): string {
  return `${points.toFixed(decimals)}%`
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`))
}

/** Formatea un mes de cobranza ('YYYY-MM-01') como "Septiembre 2026". */
export function formatMonthYear(isoDate: string): string {
  const text = monthYearFormatter.format(new Date(`${isoDate}T00:00:00`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
