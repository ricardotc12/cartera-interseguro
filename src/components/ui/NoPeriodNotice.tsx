import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Card, CardBody } from './Card'

interface NoPeriodNoticeProps {
  message?: string
  /** Si ya existe un período anterior, se ofrece crear el siguiente a partir de él (sección 45) en vez de mandar a una lista vacía. */
  latestPeriod?: { id: string; name: string } | null
}

export function NoPeriodNotice({
  message = 'El sistema no inventa reglas: configura el período correspondiente (fechas, metas y reglas) antes de ver cálculos.',
  latestPeriod,
}: NoPeriodNoticeProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardBody className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-900">No hay un período de incentivo configurado para hoy</p>
          <p className="mt-1 text-sm text-amber-800">{message}</p>
          <Link
            to="/configuracion/periodos"
            state={latestPeriod ? { createFromPeriodId: latestPeriod.id } : undefined}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            {latestPeriod ? `Crear el siguiente período (a partir de ${latestPeriod.name})` : 'Configurar período'}
          </Link>
        </div>
      </CardBody>
    </Card>
  )
}
