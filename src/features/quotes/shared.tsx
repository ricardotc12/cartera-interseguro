import { Info } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/format'
import { findProtectionType } from '@/domain'
import type { ProtectionType } from '@/types/domain'

/** Badge que recuerda en todas las pantallas del cotizador que nada acá es una cotización oficial. */
export function PreliminaryBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
      <Info className="h-3.5 w-3.5" />
      Valores referenciales / Simulación preliminar
    </span>
  )
}

/** Texto legal a pie de cada vista pensada para mostrarle al cliente (sección 15, tal cual lo redactó la asesora). */
export function PreliminaryDisclaimer() {
  return (
    <p className="text-xs text-slate-400">
      <span className="font-medium text-slate-500">Importante:</span> los valores mostrados son referenciales y tienen como
      finalidad brindar una orientación inicial. La prima, monto asegurado, devolución y condiciones definitivas pueden variar
      según la edad exacta del cliente, características de la póliza, coberturas seleccionadas y condiciones aplicables. La
      cotización oficial determinará los valores finales.
    </p>
  )
}

/** Un monto que todavía no se ha registrado se muestra como "Por definir", nunca como 0 o vacío (para no sugerir un valor real). */
export function MoneyValue({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">Por definir</span>
  return <>{formatCurrency(value)}</>
}

export function PercentValue({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-400">Por definir</span>
  return <>{formatPercentage(value, 0)}</>
}

const COVERAGE_LABELS = [
  { key: 'fallecimiento', label: 'Fallecimiento' },
  { key: 'fallecimientoAccidental', label: 'Fallecimiento por accidente' },
  { key: 'invalidezTotal', label: 'Invalidez total' },
  { key: 'enfermedadesGraves', label: 'Enfermedades graves e intervenciones' },
] as const

/** Lista de las 4 coberturas posibles, marcando cuáles incluye este tipo de protección (sección 11: nunca dejar un espacio ambiguo, siempre decir incluida o no incluida). */
export function CoverageList({ protectionType }: { protectionType: ProtectionType }) {
  const def = findProtectionType(protectionType)
  return (
    <ul className="space-y-1.5 text-sm">
      {COVERAGE_LABELS.map(({ key, label }) => {
        const included = def.coverages[key]
        return (
          <li key={key} className={included ? 'text-slate-700' : 'text-slate-400'}>
            {included ? '✓' : '—'} {label}
            {!included && <span className="ml-1 text-xs">(no incluida)</span>}
          </li>
        )
      })}
    </ul>
  )
}
