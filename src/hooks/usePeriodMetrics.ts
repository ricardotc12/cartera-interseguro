import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  calculateBaseIncentive,
  calculateCollectionFactor,
  calculateCollectionRatio,
  calculateFinalIncentive,
  calculateICVFactor,
  findIncentiveTier,
  calculateVidaEmission,
  effectiveDueDate,
  getDisplayPaymentStatus,
} from '@/domain'
import { today } from '@/lib/date'
import type { IncentiveRule, PaymentStatus } from '@/types/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'
import { useProfile } from './useProfile'

export interface PeriodMetrics {
  totalAffiliationAmount: number
  newPoliciesCount: number
  newAffiliatesCount: number
  vidaEmission: number
  incentiveTier: IncentiveRule | null
  baseIncentive: number | null
  collectionRatio: number | null
  collectionFactor: number | null
  icvPercentage: number | null
  icvFactor: number | null
  finalIncentive: number | null
  paidPaymentsCount: number
  pendingPaymentsCount: number
}

export function usePeriodMetrics(period: PeriodWithRules | null, icvPercentage: number | null) {
  const { profile } = useProfile()
  const includeCollectionFactor = profile?.showCollectionRatio ?? false
  const includeIcvFactor = profile?.showIcv ?? false

  const [metrics, setMetrics] = useState<PeriodMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!period) {
      setMetrics(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      if (!period) return
      setLoading(true)

      const [policiesResult, paymentsResult] = await Promise.all([
        supabase
          .from('policies')
          .select('affiliate_id, affiliation_amount')
          .gte('start_date', period.startDate)
          .lte('start_date', period.endDate),
        // No se filtra por year_month en la consulta: year_month siempre es el día 1 del
        // mes de cobranza, pero el período corre del 16 al 15 — comparar esa fecha
        // truncada contra el rango del período dejaba fuera el mes que sí corresponde
        // (su cobro real es el 20) y de rebote incluía el mes siguiente, que aún no
        // vence. Se filtra abajo por la fecha de vencimiento real de cada pago.
        supabase.from('payments').select('expected_amount, paid_amount, is_rescheduled, status, year_month, due_date'),
      ])

      if (cancelled) return

      if (policiesResult.error || paymentsResult.error) {
        setError((policiesResult.error ?? paymentsResult.error)!.message)
        setLoading(false)
        return
      }

      const periodPolicies = policiesResult.data ?? []
      const totalAffiliationAmount = periodPolicies.reduce((sum, p) => sum + p.affiliation_amount, 0)
      const newAffiliatesCount = new Set(periodPolicies.map((p) => p.affiliate_id)).size
      const vidaEmission = calculateVidaEmission(totalAffiliationAmount, period.vidaEmissionMultiplier)
      const incentiveTier = findIncentiveTier(vidaEmission, period.incentiveRules)
      const baseIncentive = incentiveTier != null ? calculateBaseIncentive(vidaEmission, incentiveTier) : null

      const billablePayments = (paymentsResult.data ?? [])
        .map((p) => ({
          expectedAmount: p.expected_amount,
          paidAmount: p.paid_amount,
          isRescheduled: p.is_rescheduled,
          status: p.status as PaymentStatus,
          dueDate: effectiveDueDate(p.year_month, p.due_date),
        }))
        .filter((p) => p.dueDate >= period.startDate && p.dueDate <= period.endDate)
      const collectionRatio = calculateCollectionRatio(billablePayments)
      const collectionFactor = collectionRatio != null ? calculateCollectionFactor(collectionRatio, period.collectionFactorRules) : null

      const icvFactor = icvPercentage != null ? calculateICVFactor(icvPercentage, period.icvFactorRules) : null

      // Mientras la asesora no confirme la fórmula oficial de Factor Cobranza/ICV con
      // Interseguro, esos factores quedan en neutro (1) para el Incentivo Final — no se
      // inventa ni se aplica un cálculo sin confirmar. Se activan desde sus propias
      // pantallas (profiles.show_collection_ratio / show_icv).
      const effectiveCollectionFactor = includeCollectionFactor ? collectionFactor : 1
      const effectiveIcvFactor = includeIcvFactor ? icvFactor : 1

      const finalIncentive =
        baseIncentive != null && effectiveCollectionFactor != null && effectiveIcvFactor != null
          ? calculateFinalIncentive(baseIncentive, effectiveCollectionFactor, effectiveIcvFactor)
          : null

      // "Pagos pendientes" solo cuenta lo que de verdad necesita acción hoy (Pendiente o No
      // pagado); un mes recién generado que aún no entra a su ventana de cobro (Al día) se
      // cuenta junto a los pagados, porque no hay nada pendiente que hacer con él todavía.
      const referenceDate = today()
      const paidPaymentsCount = billablePayments.filter((p) => {
        if (p.status === 'pagado') return true
        return getDisplayPaymentStatus(p.status, p.dueDate, referenceDate) === 'al_dia'
      }).length
      const pendingPaymentsCount = billablePayments.filter((p) => {
        if (p.status !== 'no_pagado' && p.status !== 'pendiente_confirmar') return false
        return getDisplayPaymentStatus(p.status, p.dueDate, referenceDate) !== 'al_dia'
      }).length

      setMetrics({
        totalAffiliationAmount,
        newPoliciesCount: periodPolicies.length,
        newAffiliatesCount,
        vidaEmission,
        incentiveTier,
        baseIncentive,
        collectionRatio,
        collectionFactor,
        icvPercentage,
        icvFactor,
        finalIncentive,
        paidPaymentsCount,
        pendingPaymentsCount,
      })
      setError(null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [period, icvPercentage, includeCollectionFactor, includeIcvFactor])

  return { metrics, loading, error }
}
