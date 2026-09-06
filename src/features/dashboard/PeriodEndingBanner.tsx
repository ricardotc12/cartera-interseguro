import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { calculateDaysUntil } from '@/domain'
import { formatDate } from '@/lib/format'
import type { PeriodWithRules } from '@/hooks/usePeriodsAdmin'

const WARNING_DAYS = 5

/** Avisa con anticipación que el período activo está por terminar (sección 45), para no depender de que la asesora se acuerde sola. */
export function PeriodEndingBanner({ currentPeriod }: { currentPeriod: PeriodWithRules }) {
  const today = new Date().toISOString().slice(0, 10)
  const daysLeft = calculateDaysUntil(currentPeriod.endDate, today)

  if (currentPeriod.status !== 'active' || daysLeft > WARNING_DAYS || daysLeft < 0) return null

  return (
    <Card className="border-brand-200 bg-brand-50">
      <CardBody className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm font-medium text-brand-900">
            {daysLeft === 0
              ? `Tu período "${currentPeriod.name}" termina hoy`
              : `Tu período "${currentPeriod.name}" termina en ${daysLeft} día${daysLeft === 1 ? '' : 's'} (${formatDate(currentPeriod.endDate)})`}
          </p>
          <p className="mt-1 text-sm text-brand-800">¿Quieres preparar el siguiente período desde ahora?</p>
          <Link
            to="/configuracion/periodos"
            state={{ createFromPeriodId: currentPeriod.id }}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Crear siguiente período
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
