import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  calculateBaseIncentive,
  calculateCollectionFactor,
  calculateCollectionRatio,
  calculateFinalIncentive,
  calculateICVFactor,
  calculateIncentivePercentage,
  calculateVidaEmission,
} from '@/domain'
import type { PaymentStatus } from '@/types/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'
import { useProfile } from './useProfile'

export interface PeriodMetrics {
  totalAffiliationAmount: number
  newPoliciesCount: number
  vidaEmission: number
  incentivePercentage: number | null
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
        supabase.from('policies').select('affiliation_amount').gte('start_date', period.startDate).lte('start_date', period.endDate),
        supabase
          .from('payments')
          .select('expected_amount, paid_amount, is_rescheduled, status')
          .gte('year_month', period.startDate)
          .lte('year_month', period.endDate),
      ])

      if (cancelled) return

      if (policiesResult.error || paymentsResult.error) {
        setError((policiesResult.error ?? paymentsResult.error)!.message)
        setLoading(false)
        return
      }

      const totalAffiliationAmount = (policiesResult.data ?? []).reduce((sum, p) => sum + p.affiliation_amount, 0)
      const vidaEmission = calculateVidaEmission(totalAffiliationAmount, period.vidaEmissionMultiplier)
      const incentivePercentage = calculateIncentivePercentage(vidaEmission, period.incentiveRules)
      const baseIncentive = incentivePercentage != null ? calculateBaseIncentive(vidaEmission, incentivePercentage) : null

      const billablePayments = (paymentsResult.data ?? []).map((p) => ({
        expectedAmount: p.expected_amount,
        paidAmount: p.paid_amount,
        isRescheduled: p.is_rescheduled,
        status: p.status as PaymentStatus,
      }))
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

      const paidPaymentsCount = billablePayments.filter((p) => p.status === 'pagado').length
      const pendingPaymentsCount = billablePayments.filter((p) => p.status === 'no_pagado' || p.status === 'pendiente_confirmar').length

      setMetrics({
        totalAffiliationAmount,
        newPoliciesCount: (policiesResult.data ?? []).length,
        vidaEmission,
        incentivePercentage,
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
