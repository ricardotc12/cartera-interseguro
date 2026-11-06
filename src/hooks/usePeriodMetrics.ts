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
  qualifiesForIcv,
} from '@/domain'
import { today } from '@/lib/date'
import type { AffiliateStatus, IncentiveRule, PaymentStatus } from '@/types/domain'
import type { PeriodWithRules } from './usePeriodsAdmin'
import { useProfile } from './useProfile'

export interface PeriodMetrics {
  totalEmissionAmount: number
  newPoliciesCount: number
  newAffiliatesCount: number
  vidaEmission: number
  incentiveTier: IncentiveRule | null
  baseIncentive: number | null
  collectionRatio: number | null
  collectionFactor: number | null
  icvPercentage: number | null
  /** Suma de lo recaudado en las cuotas que cuentan para ICV (sección "primer año" de pólizas anuladas). */
  icvRecaudado: number
  /** Suma de lo por cobrar en esas mismas cuotas — el denominador del ICV. */
  icvPorCobrar: number
  icvFactor: number | null
  finalIncentive: number | null
  paidPaymentsCount: number
  pendingPaymentsCount: number
}

export function usePeriodMetrics(period: PeriodWithRules | null) {
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
          .select('affiliate_id, emission_amount')
          .gte('start_date', period.startDate)
          .lte('start_date', period.endDate),
        // No se filtra por year_month en la consulta: year_month siempre es el día 1 del
        // mes de cobranza, pero el período corre del 16 al 15 — comparar esa fecha
        // truncada contra el rango del período dejaba fuera el mes que sí corresponde
        // (su cobro real es el 20) y de rebote incluía el mes siguiente, que aún no
        // vence. Se filtra abajo por la fecha de vencimiento real de cada pago.
        // Se trae también el estado y la Fecha de Emisión de la póliza de cada pago: el
        // ICV necesita saber si la póliza está anulada y hace cuánto se emitió (REGLA "primer
        // año de pólizas anuladas").
        supabase
          .from('payments')
          .select('expected_amount, paid_amount, is_rescheduled, status, year_month, due_date, policies(status, start_date)'),
      ])

      if (cancelled) return

      if (policiesResult.error || paymentsResult.error) {
        setError((policiesResult.error ?? paymentsResult.error)!.message)
        setLoading(false)
        return
      }

      const periodPolicies = policiesResult.data ?? []
      const totalEmissionAmount = periodPolicies.reduce((sum, p) => sum + p.emission_amount, 0)
      const newAffiliatesCount = new Set(periodPolicies.map((p) => p.affiliate_id)).size
      const vidaEmission = calculateVidaEmission(totalEmissionAmount, period.vidaEmissionMultiplier)
      const incentiveTier = findIncentiveTier(vidaEmission, period.incentiveRules)
      const baseIncentive = incentiveTier != null ? calculateBaseIncentive(vidaEmission, incentiveTier) : null

      const paymentRows = (paymentsResult.data ?? []) as unknown as {
        expected_amount: number
        paid_amount: number | null
        is_rescheduled: boolean
        status: PaymentStatus
        year_month: string
        due_date: string | null
        policies: { status: AffiliateStatus; start_date: string } | null
      }[]

      const paymentsInPeriod = paymentRows
        .map((p) => ({
          expectedAmount: p.expected_amount,
          paidAmount: p.paid_amount,
          isRescheduled: p.is_rescheduled,
          status: p.status,
          dueDate: effectiveDueDate(p.year_month, p.due_date),
          yearMonth: p.year_month,
          policy: p.policies,
        }))
        .filter((p) => p.dueDate >= period.startDate && p.dueDate <= period.endDate)

      // Ratio Cobranza y los conteos de pagos miden la cobranza del negocio vigente — las
      // cuotas "fantasma" que se generan para pólizas anuladas (solo para ICV, ver abajo) no
      // deben contarse aquí, o inflarían "por cobrar" y bajarían el ratio sin que sea cobranza
      // real pendiente de gestionar.
      const billablePayments = paymentsInPeriod.filter((p) => p.policy?.status !== 'cancelado')
      const collectionRatio = calculateCollectionRatio(billablePayments)
      const collectionFactor = collectionRatio != null ? calculateCollectionFactor(collectionRatio, period.collectionFactorRules) : null

      // ICV: las mismas cuotas del período, pero solo las que corresponden (activas/pendientes
      // siempre; anuladas solo dentro de su primer año de emisión — ver domain/icv.ts).
      const icvPayments = paymentsInPeriod.filter((p) => p.policy != null && qualifiesForIcv(p.policy.status, p.policy.start_date, p.yearMonth))
      const icvPercentage = calculateCollectionRatio(icvPayments)
      const icvRecaudado = icvPayments.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0)
      const icvPorCobrar = icvPayments.reduce((sum, p) => sum + p.expectedAmount, 0)
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
        totalEmissionAmount,
        newPoliciesCount: periodPolicies.length,
        newAffiliatesCount,
        vidaEmission,
        incentiveTier,
        baseIncentive,
        collectionRatio,
        collectionFactor,
        icvPercentage,
        icvRecaudado,
        icvPorCobrar,
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
  }, [period, includeCollectionFactor, includeIcvFactor])

  return { metrics, loading, error }
}
