import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { calculateDaysUntil } from '@/domain'
import { formatDate } from '@/lib/format'
import { today } from '@/lib/date'
import type { PeriodWithRules } from '@/hooks/usePeriodsAdmin'

const WARNING_DAYS = 5

/**
 * Avisa con anticipación que el período vigente está por terminar (sección 45), para no
 * depender de que la asesora se acuerde sola. `currentPeriod` ya viene resuelto por fecha
 * (el período cuyo rango contiene hoy) — no se vuelve a filtrar por su campo "Estado"
 * (Borrador/Activo/Cerrado), que es solo una etiqueta administrativa manual y no siempre
 * coincide con cuál es el período realmente vigente hoy.
 */
export function PeriodEndingBanner({ currentPeriod }: { currentPeriod: PeriodWithRules }) {
  const daysLeft = calculateDaysUntil(currentPeriod.endDate, today())
  const shouldWarn = daysLeft >= 0 && daysLeft <= WARNING_DAYS
  const [dismissed, setDismissed] = useState(false)

  if (!shouldWarn || dismissed) return null

  return (
    <Modal
      open
      onClose={() => setDismissed(true)}
      title={daysLeft === 0 ? 'Tu período termina hoy' : 'Tu período está por terminar'}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p className="text-sm text-slate-700">
            {daysLeft === 0 ? (
              <>
                El período <span className="font-semibold">"{currentPeriod.name}"</span> termina hoy.
              </>
            ) : (
              <>
                El período <span className="font-semibold">"{currentPeriod.name}"</span> termina en {daysLeft} día
                {daysLeft === 1 ? '' : 's'} ({formatDate(currentPeriod.endDate)}).
              </>
            )}{' '}
            ¿Quieres preparar el siguiente período desde ahora?
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDismissed(true)}>
            Recordarme después
          </Button>
          <Link
            to="/configuracion/periodos"
            state={{ createFromPeriodId: currentPeriod.id }}
            onClick={() => setDismissed(true)}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Crear siguiente período
          </Link>
        </div>
      </div>
    </Modal>
  )
}
