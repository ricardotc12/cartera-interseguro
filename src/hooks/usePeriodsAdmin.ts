import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CollectionFactorRule, IcvFactorRule, IncentivePeriod, IncentiveRule, PeriodStatus } from '@/types/domain'

export interface PeriodInput {
  name: string
  startDate: string
  endDate: string
  vidaEmissionGoal: number
  vidaEmissionMultiplier: number
  icvGoal: number | null
  collectionGoal: number | null
  notes: string | null
}

export interface TierInput {
  min: number
  max: number | null
}

export type IncentiveTierInput = TierInput &
  ({ valueType: 'percentage'; percentage: number } | { valueType: 'fixed'; fixedAmount: number })

export interface FactorTierInput extends TierInput {
  factor: number
}

export interface PeriodRulesPayload {
  incentiveRules: IncentiveTierInput[]
  collectionFactorRules: FactorTierInput[]
  icvFactorRules: FactorTierInput[]
}

export interface PeriodWithRules extends IncentivePeriod {
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string | null
  incentiveRules: IncentiveRule[]
  collectionFactorRules: CollectionFactorRule[]
  icvFactorRules: IcvFactorRule[]
  /** Resumen para la tabla de administración (sección 11): el tramo más alto configurado (puede ser monto fijo o porcentaje). */
  topIncentiveTier: IncentiveRule | null
  maxCollectionFactor: number | null
  maxIcvFactor: number | null
}

interface PeriodRow {
  id: string
  name: string
  start_date: string
  end_date: string
  status: PeriodStatus
  vida_emission_goal: number
  vida_emission_multiplier: number
  icv_goal: number | null
  collection_goal: number | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
  incentive_rules: {
    id: string
    period_id: string
    min_amount: number
    max_amount: number | null
    value_type: 'percentage' | 'fixed'
    percentage: number | null
    fixed_amount: number | null
    sort_order: number
  }[]
  collection_factor_rules: { id: string; period_id: string; min_ratio: number; max_ratio: number | null; factor: number; sort_order: number }[]
  icv_factor_rules: { id: string; period_id: string; min_ratio: number; max_ratio: number | null; factor: number; sort_order: number }[]
}

function mapPeriod(row: PeriodRow): PeriodWithRules {
  const incentiveRules: IncentiveRule[] = row.incentive_rules
    .map((r): IncentiveRule =>
      r.value_type === 'fixed'
        ? {
            id: r.id,
            periodId: r.period_id,
            min: r.min_amount,
            max: r.max_amount,
            sortOrder: r.sort_order,
            valueType: 'fixed',
            fixedAmount: r.fixed_amount as number,
            percentage: null,
          }
        : {
            id: r.id,
            periodId: r.period_id,
            min: r.min_amount,
            max: r.max_amount,
            sortOrder: r.sort_order,
            valueType: 'percentage',
            percentage: r.percentage as number,
            fixedAmount: null,
          },
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const collectionFactorRules: CollectionFactorRule[] = row.collection_factor_rules
    .map((r) => ({ id: r.id, periodId: r.period_id, min: r.min_ratio, max: r.max_ratio, sortOrder: r.sort_order, factor: r.factor }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const icvFactorRules: IcvFactorRule[] = row.icv_factor_rules
    .map((r) => ({ id: r.id, periodId: r.period_id, min: r.min_ratio, max: r.max_ratio, sortOrder: r.sort_order, factor: r.factor }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    vidaEmissionGoal: row.vida_emission_goal,
    vidaEmissionMultiplier: row.vida_emission_multiplier,
    icvGoal: row.icv_goal,
    collectionGoal: row.collection_goal,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    incentiveRules,
    collectionFactorRules,
    icvFactorRules,
    topIncentiveTier: incentiveRules.reduce<IncentiveRule | null>(
      (top, r) => (top == null || r.min > top.min ? r : top),
      null,
    ),
    maxCollectionFactor: collectionFactorRules.length ? Math.max(...collectionFactorRules.map((r) => r.factor)) : null,
    maxIcvFactor: icvFactorRules.length ? Math.max(...icvFactorRules.map((r) => r.factor)) : null,
  }
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === '23P01' || error.message.includes('overlap') || error.message.includes('exclude')) {
    return 'Las fechas o los tramos ingresados se solapan con otro período/regla existente.'
  }
  return error.message
}

export function usePeriodsAdmin() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<PeriodWithRules[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('incentive_periods')
      .select('*, incentive_rules(*), collection_factor_rules(*), icv_factor_rules(*)')
      .order('start_date', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPeriods(((data as unknown as PeriodRow[]) ?? []).map(mapPeriod))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function insertRules(periodId: string, rules: PeriodRulesPayload) {
    if (!user) return { error: 'Debes iniciar sesión.' }

    if (rules.incentiveRules.length > 0) {
      const { error: e1 } = await supabase.from('incentive_rules').insert(
        rules.incentiveRules.map((r, i) => ({
          period_id: periodId,
          min_amount: r.min,
          max_amount: r.max,
          value_type: r.valueType,
          percentage: r.valueType === 'percentage' ? r.percentage : null,
          fixed_amount: r.valueType === 'fixed' ? r.fixedAmount : null,
          sort_order: i,
          created_by: user.id,
        })),
      )
      if (e1) return { error: friendlyError(e1) }
    }

    if (rules.collectionFactorRules.length > 0) {
      const { error: e2 } = await supabase.from('collection_factor_rules').insert(
        rules.collectionFactorRules.map((r, i) => ({
          period_id: periodId,
          min_ratio: r.min,
          max_ratio: r.max,
          factor: r.factor,
          sort_order: i,
          created_by: user.id,
        })),
      )
      if (e2) return { error: friendlyError(e2) }
    }

    if (rules.icvFactorRules.length > 0) {
      const { error: e3 } = await supabase.from('icv_factor_rules').insert(
        rules.icvFactorRules.map((r, i) => ({
          period_id: periodId,
          min_ratio: r.min,
          max_ratio: r.max,
          factor: r.factor,
          sort_order: i,
          created_by: user.id,
        })),
      )
      if (e3) return { error: friendlyError(e3) }
    }

    return { error: null }
  }

  async function createPeriod(period: PeriodInput, rules: PeriodRulesPayload) {
    if (!user) return { error: 'Debes iniciar sesión.' }

    const { data: periodRow, error: periodError } = await supabase
      .from('incentive_periods')
      .insert({
        name: period.name,
        start_date: period.startDate,
        end_date: period.endDate,
        status: 'draft',
        vida_emission_goal: period.vidaEmissionGoal,
        vida_emission_multiplier: period.vidaEmissionMultiplier,
        icv_goal: period.icvGoal,
        collection_goal: period.collectionGoal,
        notes: period.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (periodError || !periodRow) return { error: friendlyError(periodError!) }

    const rulesResult = await insertRules(periodRow.id, rules)
    if (rulesResult.error) {
      await supabase.from('incentive_periods').delete().eq('id', periodRow.id)
      return { error: rulesResult.error }
    }

    await refresh()
    return { error: null, periodId: periodRow.id as string }
  }

  async function updatePeriod(id: string, period: PeriodInput, rules: PeriodRulesPayload) {
    if (!user) return { error: 'Debes iniciar sesión.' }

    const current = periods.find((p) => p.id === id)
    if (current?.status === 'closed') {
      return { error: 'Este período está cerrado; sus reglas no se pueden modificar (inmutabilidad histórica).' }
    }

    const { error: updateError } = await supabase
      .from('incentive_periods')
      .update({
        name: period.name,
        start_date: period.startDate,
        end_date: period.endDate,
        vida_emission_goal: period.vidaEmissionGoal,
        vida_emission_multiplier: period.vidaEmissionMultiplier,
        icv_goal: period.icvGoal,
        collection_goal: period.collectionGoal,
        notes: period.notes,
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) return { error: friendlyError(updateError) }

    // Reemplaza el conjunto de reglas (más simple y transparente que un diff fila por fila;
    // el historial de auditoría igual queda registrado como delete + insert).
    await supabase.from('incentive_rules').delete().eq('period_id', id)
    await supabase.from('collection_factor_rules').delete().eq('period_id', id)
    await supabase.from('icv_factor_rules').delete().eq('period_id', id)

    const rulesResult = await insertRules(id, rules)
    if (rulesResult.error) return { error: rulesResult.error }

    await refresh()
    return { error: null }
  }

  async function setPeriodStatus(id: string, status: PeriodStatus) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('incentive_periods')
      .update({ status, updated_by: user.id })
      .eq('id', id)
    if (updateError) return { error: friendlyError(updateError) }
    await refresh()
    return { error: null }
  }

  async function deletePeriod(id: string) {
    const period = periods.find((p) => p.id === id)
    if (period?.status !== 'draft') {
      return { error: 'Solo se pueden eliminar períodos en borrador que aún no se han activado.' }
    }
    const { error: deleteError } = await supabase.from('incentive_periods').delete().eq('id', id)
    if (deleteError) return { error: friendlyError(deleteError) }
    await refresh()
    return { error: null }
  }

  return { periods, loading, error, refresh, createPeriod, updatePeriod, setPeriodStatus, deletePeriod }
}
