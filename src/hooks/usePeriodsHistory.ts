import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateCollectionRatio, calculateVidaEmission, effectiveDueDate } from '@/domain'
import type { PaymentStatus } from '@/types/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'

export interface PeriodHistoryPoint {
  periodId: string
  name: string
  startDate: string
  vidaEmission: number
  vidaEmissionGoal: number
  collectionRatio: number | null
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
        supabase.from('policies').select('affiliation_amount, start_date'),
        supabase.from('payments').select('year_month, due_date, expected_amount, paid_amount, is_rescheduled, status'),
      ])

      if (cancelled) return
      if (policiesResult.error || paymentsResult.error) {
        setError((policiesResult.error ?? paymentsResult.error)!.message)
        setLoading(false)
        return
      }

      const policies = policiesResult.data ?? []
      const payments = paymentsResult.data ?? []

      const points: PeriodHistoryPoint[] = [...periods]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((period) => {
          const periodPolicies = policies.filter((p) => p.start_date >= period.startDate && p.start_date <= period.endDate)
          const totalAffiliationAmount = periodPolicies.reduce((sum, p) => sum + p.affiliation_amount, 0)
          const vidaEmission = calculateVidaEmission(totalAffiliationAmount, period.vidaEmissionMultiplier)

          // year_month siempre es el día 1 del mes de cobranza, pero el período corre del
          // 16 al 15 — hay que comparar contra la fecha de vencimiento real (el 20), no
          // contra esa fecha truncada, o el mes que corresponde queda fuera y entra el
          // siguiente por error (mismo bug que en usePeriodMetrics).
          const periodPayments = payments
            .filter((p) => {
              const dueDate = effectiveDueDate(p.year_month, p.due_date)
              return dueDate >= period.startDate && dueDate <= period.endDate
            })
            .map((p) => ({
              expectedAmount: p.expected_amount,
              paidAmount: p.paid_amount,
              isRescheduled: p.is_rescheduled,
              status: p.status as PaymentStatus,
            }))
          const collectionRatio = calculateCollectionRatio(periodPayments)

          return {
            periodId: period.id,
            name: period.name,
            startDate: period.startDate,
            vidaEmission,
            vidaEmissionGoal: period.vidaEmissionGoal,
            collectionRatio,
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
