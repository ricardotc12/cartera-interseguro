import { Check } from 'lucide-react'
import { clsx } from '@/lib/clsx'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accesible: úsalo siempre, aunque el texto visible ya esté afuera del componente (ver SwitchField). */
  label: string
  disabled?: boolean
}

/**
 * Control de encendido/apagado puro, sin texto propio — el llamador decide
 * dónde y cómo ubicar la etiqueta (ver SwitchField para el caso común de
 * etiqueta + descripción a la izquierda). Apagado = pastilla gris con el
 * círculo a la izquierda; encendido = pastilla navy con el círculo a la
 * derecha y un check adentro, para que el sentido "izquierda→derecha activa"
 * sea inequívoco de un vistazo.
 */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-primary-600 bg-primary-600' : 'border-slate-300 bg-slate-200',
      )}
    >
      <span
        className={clsx(
          'flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-[26px]' : 'translate-x-1',
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 text-primary-600" strokeWidth={3} />}
      </span>
    </button>
  )
}

interface SwitchFieldProps extends SwitchProps {
  description?: string
}

/** Fila responsive con el texto (etiqueta + descripción opcional) a la izquierda y el switch centrado verticalmente contra todo ese bloque, no solo contra la primera línea. */
export function SwitchField({ label, description, ...switchProps }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      <Switch label={label} {...switchProps} />
    </div>
  )
}
