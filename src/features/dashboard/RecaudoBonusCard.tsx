import { useState, type FormEvent } from 'react'
import { Award, Pencil } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/FormField'
import { formatCurrency } from '@/lib/format'
import { today } from '@/lib/date'
import {
  calculateRecaudoBonus,
  calculateRecaudoBonusBase,
  calculateTenureMonths,
  findLowestTier,
  isEligibleForRecaudoBonus,
  RECAUDO_BONUS_MIN_TENURE_MONTHS,
  RECAUDO_BONUS_RATE,
} from '@/domain'
import type { Profile } from '@/hooks/useProfile'
import type { PaymentWithContext } from '@/hooks/usePayments'
import type { PeriodWithRules } from '@/hooks/usePeriodsAdmin'

interface RecaudoBonusCardProps {
  profile: Profile
  setInterseguroStartDate: (date: string) => Promise<{ error: string | null }>
  currentPeriod: PeriodWithRules
  vidaEmission: number
  payments: PaymentWithContext[]
}

export function RecaudoBonusCard({ profile, setInterseguroStartDate, currentPeriod, vidaEmission, payments }: RecaudoBonusCardProps) {
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!date) return
    setSubmitting(true)
    await setInterseguroStartDate(date)
    setSubmitting(false)
    setEditing(false)
  }

  if (!profile.interseguroStartDate || editing) {
    return (
      <Card>
        <CardBody>
          <p className="mb-2 text-sm font-semibold text-slate-700">Bono de Recaudo</p>
          <p className="mb-3 text-sm text-slate-500">
            Ingresa tu fecha de ingreso a Interseguro para ver tu antigüedad y el simulador del Bono de Recaudo.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <input
              autoFocus
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today()}
              className={`${fieldClass()} max-w-[200px]`}
            />
            <Button type="submit" size="sm" disabled={submitting}>
              Guardar
            </Button>
            {profile.interseguroStartDate && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            )}
          </form>
        </CardBody>
      </Card>
    )
  }

  const tenureMonths = calculateTenureMonths(profile.interseguroStartDate, today())
  const lowestTier = findLowestTier(currentPeriod.incentiveRules)
  const eligible = isEligibleForRecaudoBonus(tenureMonths, vidaEmission, lowestTier?.min ?? null)

  return (
    <Card>
      <CardBody>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Bono de Recaudo</p>
          <button
            onClick={() => {
              setDate(profile.interseguroStartDate ?? '')
              setEditing(true)
            }}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar fecha de ingreso
          </button>
        </div>

        {tenureMonths < RECAUDO_BONUS_MIN_TENURE_MONTHS ? (
          <>
            <Badge tone="neutral" dot>
              Agente en Formación (&lt;{RECAUDO_BONUS_MIN_TENURE_MONTHS} meses)
            </Badge>
            <p className="mt-2 text-sm text-slate-500">
              El bono de recaudo del {RECAUDO_BONUS_RATE * 100}% se activará automáticamente al cumplir tu {RECAUDO_BONUS_MIN_TENURE_MONTHS}
              .º mes (llevas {tenureMonths}).
            </p>
          </>
        ) : !eligible ? (
          <>
            <Badge tone="info" dot>
              Agente Senior / Apto para Recaudo ({RECAUDO_BONUS_RATE * 100}%)
            </Badge>
            <p className="mt-2 text-sm text-slate-500">
              Aún no alcanzas la primera banda de Incentivos del período vigente — el simulador se activa al llegar al tramo mínimo
              configurado.
            </p>
          </>
        ) : (
          <>
            <Badge tone="success" dot>
              Agente Senior / Apto para Recaudo ({RECAUDO_BONUS_RATE * 100}%)
            </Badge>
            {(() => {
              const base = calculateRecaudoBonusBase(
                payments.map((p) => ({ status: p.status, paidAmount: p.paidAmount, policyStartDate: p.policy.startDate })),
                today(),
              )
              const bonus = calculateRecaudoBonus(base)
              return (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cobranza calificada (≤18 meses)</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(base)}</p>
                  </div>
                  <div className="rounded-lg bg-primary-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary-700">Bono estimado ({RECAUDO_BONUS_RATE * 100}%)</p>
                    <p className="mt-1 flex items-center gap-1 text-lg font-bold text-slate-900">
                      <Award className="h-4 w-4 text-primary-600" />
                      {formatCurrency(bonus)}
                    </p>
                  </div>
                </div>
              )
            })()}
            <p className="mt-3 text-xs text-slate-400">
              📌 Nota: Este monto es una simulación estimada del bono máximo a recaudar. El pago final del {RECAUDO_BONUS_RATE * 100}% está
              sujeto a que el 100% de la cobranza se realice mediante Débito Automático o Yape.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  )
}
