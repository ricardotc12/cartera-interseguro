import { clsx } from '@/lib/clsx'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accesible: úsalo siempre, aunque el texto visible ya esté afuera del componente (ver SwitchField). */
  label: string
  disabled?: boolean
}

/** Control de encendido/apagado puro, sin texto propio — el llamador decide dónde y cómo ubicar la etiqueta (ver SwitchField para el caso común de etiqueta + descripción a la izquierda). */
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
        'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary-600' : 'bg-slate-300',
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
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
