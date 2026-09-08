import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { IncentivePeriod } from '@/types/domain'
import { calculatePeriodForDate } from '@/domain'
import { today } from '@/lib/date'

function mapPeriod(row: {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'closed'
  vida_emission_goal: number
  vida_emission_multiplier: number
  icv_goal: number | null
  collection_goal: number | null
  notes: string | null
}): IncentivePeriod {
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
  }
}

interface UsePeriodsResult {
  periods: IncentivePeriod[]
  currentPeriod: IncentivePeriod | null
  loading: boolean
  error: string | null
}

/** Carga los períodos del usuario y resuelve cuál corresponde a la fecha de hoy (sección 10). */
export function usePeriods(referenceDate: string = today()): UsePeriodsResult {
  const [periods, setPeriods] = useState<IncentivePeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('incentive_periods')
        .select('*')
        .order('start_date', { ascending: false })

      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setPeriods((data ?? []).map(mapPeriod))
        setError(null)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const currentPeriod = calculatePeriodForDate(referenceDate, periods)

  return { periods, currentPeriod, loading, error }
}
