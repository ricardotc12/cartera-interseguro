import { useEffect, useState } from 'react'
import { clsx } from '@/lib/clsx'

interface ProgressBarProps {
  /** Fracción 0-1 (o mayor a 1 si se superó la meta; se recorta visualmente al 100%). */
  value: number
  tone?: 'brand' | 'secondary' | 'success' | 'warning' | 'danger'
  className?: string
  /** Etiqueta superior (ej. "Meta Emisión Vida"). Si se omite, se renderiza solo la barra (uso compacto). */
  label?: string
  /** Valor actual formateado (ej. "S/ 12,000.00"). */
  current?: string
  /** Valor objetivo formateado (ej. "S/ 13,999.00"). */
  target?: string
}

const fillClasses = {
  brand: 'bg-gradient-to-r from-primary-400 to-primary-600',
  secondary: 'bg-gradient-to-r from-secondary-400 to-secondary-600',
  success: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  warning: 'bg-gradient-to-r from-amber-400 to-amber-500',
  danger: 'bg-gradient-to-r from-red-400 to-red-600',
}

const textClasses = {
  brand: 'text-primary-700',
  secondary: 'text-secondary-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
}

export function ProgressBar({ value, tone = 'brand', className, label, current, target }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  // Arranca en 0 y anima hacia el valor real al montar, para que se sienta dinámica (sección 7).
  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedPct(pct))
    return () => cancelAnimationFrame(raf)
  }, [pct])

  const bar = (
    <div className={clsx('h-2.5 w-full overflow-hidden rounded-full bg-slate-100', !label && className)}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-700 ease-out', fillClasses[tone])}
        style={{ width: `${animatedPct}%` }}
      />
    </div>
  )

  if (!label) return bar

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className={clsx('text-lg font-bold tabular-nums', textClasses[tone])}>{Math.round(pct)}%</span>
      </div>
      {bar}
      {(current || target) && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>{current}</span>
          {target && <span>Meta: {target}</span>}
        </div>
      )}
    </div>
  )
}
