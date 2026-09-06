import type { HTMLAttributes } from 'react'
import { clsx } from '@/lib/clsx'

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10',
  info: 'bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-600/20',
}

const dotClasses: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-slate-400',
  info: 'bg-secondary-500',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  /** Punto de color antes del texto (sección 8: "estado con icono/color semántico"). */
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', toneClasses[tone], className)}
      {...props}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  )
}
