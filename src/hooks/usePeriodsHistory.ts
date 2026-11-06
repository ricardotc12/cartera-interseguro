import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateCollectionRatio, calculateVidaEmission, effectiveDueDate, qualifiesForIcv } from '@/domain'
import { today } from '@/lib/date'
import type { AffiliateStatus, PaymentStatus } from '@/types/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'

export interface PeriodHistoryPoint {
  periodId: string
  name: string
  startDate: string
  vidaEmission: number
  vidaEmissionGoal: number
  collectionRatio: number | null
  icvPercentage: number | null
}

/**
 * Emisión Vida y Ratio Cobranza de cada período, para graficar la evolución
 * mensual del Dashboard. Trae todas las pólizas y pagos en dos consultas y
 * los agrupa en memoria por rango de fechas de cada período (evita 1 consulta
 * por período).
 */
export function usePeriodsHistory(periods: PeriodWithRules[]) {
  const [history, setHistory] = useState<PeriodHistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (periods.length === 0) {
      setHistory([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      const [policiesResult, paymentsResult] = await Promise.all([
        supabase.from('policies').select('emission_amount, start_date'),
        supabase
          .from('payments')
          .select('year_month, due_date, expected_amount, paid_amount, is_rescheduled, status, policies(status, start_date)'),
      ])

      if (cancelled) return
      if (policiesResult.error || paymentsResult.error) {
        setError((policiesResult.error ?? paymentsResult.error)!.message)
        setLoading(false)
        return
      }

      const todayDate = today()
      const policies = policiesResult.data ?? []
      const payments = (paymentsResult.data ?? []) as unknown as {
        year_month: string
        due_date: string | null
        expected_amount: number
        paid_amount: number | null
        is_rescheduled: boolean
        status: PaymentStatus
        policies: { status: AffiliateStatus; start_date: string } | null
      }[]

      const points: PeriodHistoryPoint[] = [...periods]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((period) => {
          const periodPolicies = policies.filter((p) => p.start_date >= period.startDate && p.start_date <= period.endDate)
          const totalEmissionAmount = periodPolicies.reduce((sum, p) => sum + p.emission_amount, 0)
          const vidaEmission = calculateVidaEmission(totalEmissionAmount, period.vidaEmissionMultiplier)

          // year_month siempre es el día 1 del mes de cobranza, pero el período corre del
          // 16 al 15 — hay que comparar contra la fecha de vencimiento real (el 20), no
          // contra esa fecha truncada, o el mes que corresponde queda fuera y entra el
          // siguiente por error (mismo bug que en usePeriodMetrics).
          const allPaymentsMapped = payments.map((p) => ({
            expectedAmount: p.expected_amount,
            paidAmount: p.paid_amount,
            isRescheduled: p.is_rescheduled,
            status: p.status,
            dueDate: effectiveDueDate(p.year_month, p.due_date),
            yearMonth: p.year_month,
            policy: p.policies,
          }))
          const periodPayments = allPaymentsMapped.filter((p) => p.dueDate >= period.startDate && p.dueDate <= period.endDate)
          // Ratio Cobranza excluye las cuotas "fantasma" que solo existen para ICV en pólizas
          // anuladas (concepto por período, igual que en usePeriodMetrics).
          const collectionRatio = calculateCollectionRatio(periodPayments.filter((p) => p.policy?.status !== 'cancelado'))
          // ICV, a diferencia de Ratio Cobranza, es acumulado: todas las cuotas que corresponden
          // hasta el fin de este período (no solo las que vencen dentro de él) — mismo criterio
          // que usePeriodMetrics, para que el historial muestre la evolución del acumulado real
          // y no una fracción por período que no coincide con el reporte oficial de Interseguro.
          // Tope adicional "hasta hoy" para el período vigente (cuyo fin todavía no llega):
          // generateOwedMonths pre-genera cuotas futuras (hasta diciembre del año en curso), que
          // Interseguro todavía ni cobra — sin este tope se contarían de más.
          const icvCutoff = period.endDate < todayDate ? period.endDate : todayDate
          const icvPayments = allPaymentsMapped.filter(
            (p) => p.dueDate <= icvCutoff && p.policy != null && qualifiesForIcv(p.policy.status, p.policy.start_date, p.yearMonth),
          )
          const icvPercentage = calculateCollectionRatio(icvPayments)

          return {
            periodId: period.id,
            name: period.name,
            startDate: period.startDate,
            vidaEmission,
            vidaEmissionGoal: period.vidaEmissionGoal,
            collectionRatio,
            icvPercentage,
          }
        })

      setHistory(points)
      setError(null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [periods])

  return { history, loading, error }
}
