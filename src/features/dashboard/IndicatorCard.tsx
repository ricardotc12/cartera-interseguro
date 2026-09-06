import type { LucideIcon } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { clsx } from '@/lib/clsx'

type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'

const iconToneClasses: Record<Tone, string> = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-secondary-50 text-secondary-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-500',
}

interface IndicatorCardProps {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  /** Color semántico del ícono (sección 5: azul=info, turquesa=actividad, verde=éxito, ámbar=pendiente, rojo=crítico). */
  tone?: Tone
}

export function IndicatorCard({ label, value, hint, icon: Icon, tone = 'neutral' }: IndicatorCardProps) {
  return (
    <Card className="animate-fade-in transition-shadow hover:shadow-card-hover">
      <CardBody className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase leading-snug tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs leading-snug text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconToneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardBody>
    </Card>
  )
}
