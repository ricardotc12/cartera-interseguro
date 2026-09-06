import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { IcvRecord } from '@/types/domain'

interface IcvRecordRow {
  id: string
  period_id: string
  icv_percentage: number
  notes: string | null
}

function mapIcvRecord(row: IcvRecordRow): IcvRecord {
  return { id: row.id, periodId: row.period_id, icvPercentage: row.icv_percentage, notes: row.notes }
}

export function useIcvRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState<IcvRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('icv_records').select('*')
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setRecords((data ?? []).map(mapIcvRecord))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  function getForPeriod(periodId: string): IcvRecord | null {
    return records.find((r) => r.periodId === periodId) ?? null
  }

  async function setIcvForPeriod(periodId: string, icvPercentage: number, notes: string | null) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const existing = getForPeriod(periodId)

    const { error: writeError } = existing
      ? await supabase
          .from('icv_records')
          .update({ icv_percentage: icvPercentage, notes, updated_by: user.id })
          .eq('id', existing.id)
      : await supabase
          .from('icv_records')
          .insert({ period_id: periodId, icv_percentage: icvPercentage, notes, created_by: user.id })

    if (writeError) return { error: writeError.message }
    await refresh()
    return { error: null }
  }

  return { records, loading, error, refresh, getForPeriod, setIcvForPeriod }
}
