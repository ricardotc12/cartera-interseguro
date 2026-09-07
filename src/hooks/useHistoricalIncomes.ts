import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { HistoricalIncome } from '@/types/domain'

interface HistoricalIncomeRow {
  id: string
  year_month: string
  amount: number
  notes: string | null
}

export interface HistoricalIncomeInput {
  yearMonth: string
  amount: number
  notes: string | null
}

function mapHistoricalIncome(row: HistoricalIncomeRow): HistoricalIncome {
  return { id: row.id, yearMonth: row.year_month, amount: row.amount, notes: row.notes }
}

export function useHistoricalIncomes() {
  const { user } = useAuth()
  const [incomes, setIncomes] = useState<HistoricalIncome[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('historical_incomes').select('*').order('year_month', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setIncomes((data ?? []).map(mapHistoricalIncome))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createIncome(input: HistoricalIncomeInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: insertError } = await supabase.from('historical_incomes').insert({
      year_month: input.yearMonth,
      amount: input.amount,
      notes: input.notes,
      created_by: user.id,
    })
    if (insertError) return { error: insertError.message }
    await refresh()
    return { error: null }
  }

  async function updateIncome(id: string, input: HistoricalIncomeInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('historical_incomes')
      .update({ year_month: input.yearMonth, amount: input.amount, notes: input.notes, updated_by: user.id })
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }

  async function deleteIncome(id: string) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: deleteError } = await supabase.from('historical_incomes').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }
    await refresh()
    return { error: null }
  }

  return { incomes, loading, error, createIncome, updateIncome, deleteIncome }
}
