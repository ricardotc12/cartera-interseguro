import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface MoraBadgeProps {
  /** Cantidad de cuotas consecutivas vencidas sin pagar (calculateMoraLevel). */
  level: number
}

/** Mora 3 y 4 son las críticas del semáforo de Cobranza — se priorizan y resaltan en rojo. */
export const MORA_CRITICAL_LEVEL = 3

export function MoraBadge({ level }: MoraBadgeProps) {
  if (level <= 0) return null
  const critical = level >= MORA_CRITICAL_LEVEL

  return (
    <Badge tone={critical ? 'danger' : 'warning'} dot={!critical}>
      {critical && <AlertTriangle className="h-3 w-3" />}
      Mora {level}
    </Badge>
  )
}
