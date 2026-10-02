import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { QuoteRate, ProtectionType } from '@/types/domain'

interface QuoteRateRow {
  id: string
  age_min: number
  age_max: number
  product: string
  plan: string
  protection_type: ProtectionType
  coverage_years: number
  prima_mensual: number | null
  prima_anual: number | null
  monto_asegurado: number | null
  pct_devolucion: number | null
  total_devolucion: number | null
  notes: string | null
}

export interface QuoteRateInput {
  ageMin: number
  ageMax: number
  product: string
  plan: string
  protectionType: ProtectionType
  coverageYears: number
  primaMensual: number | null
  primaAnual: number | null
  montoAsegurado: number | null
  pctDevolucion: number | null
  totalDevolucion: number | null
  notes: string | null
}

function mapQuoteRate(row: QuoteRateRow): QuoteRate {
  return {
    id: row.id,
    ageMin: row.age_min,
    ageMax: row.age_max,
    product: row.product,
    plan: row.plan,
    protectionType: row.protection_type,
    coverageYears: row.coverage_years,
    primaMensual: row.prima_mensual,
    primaAnual: row.prima_anual,
    montoAsegurado: row.monto_asegurado,
    pctDevolucion: row.pct_devolucion,
    totalDevolucion: row.total_devolucion,
    notes: row.notes,
  }
}

/** CRUD de las tarifas del cotizador referencial (herramienta de pre-asesoría, aparte de la cartera). */
export function useQuoteRates() {
  const { user } = useAuth()
  const [rates, setRates] = useState<QuoteRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('quote_rates')
      .select('*')
      .order('product', { ascending: true })
      .order('plan', { ascending: true })
      .order('age_min', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setRates((data ?? []).map(mapQuoteRate))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createRate(input: QuoteRateInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: insertError } = await supabase.from('quote_rates').insert({
      age_min: input.ageMin,
      age_max: input.ageMax,
      product: input.product,
      plan: input.plan,
      protection_type: input.protectionType,
      coverage_years: input.coverageYears,
      prima_mensual: input.primaMensual,
      prima_anual: input.primaAnual,
      monto_asegurado: input.montoAsegurado,
      pct_devolucion: input.pctDevolucion,
      total_devolucion: input.totalDevolucion,
      notes: input.notes,
      created_by: user.id,
    })
    if (insertError) return { error: insertError.message }
    await refresh()
    return { error: null }
  }

  async function updateRate(id: string, input: QuoteRateInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('quote_rates')
      .update({
        age_min: input.ageMin,
        age_max: input.ageMax,
        product: input.product,
        plan: input.plan,
        protection_type: input.protectionType,
        coverage_years: input.coverageYears,
        prima_mensual: input.primaMensual,
        prima_anual: input.primaAnual,
        monto_asegurado: input.montoAsegurado,
        pct_devolucion: input.pctDevolucion,
        total_devolucion: input.totalDevolucion,
        notes: input.notes,
        updated_by: user.id,
      })
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }

  async function deleteRate(id: string) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: deleteError } = await supabase.from('quote_rates').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }
    await refresh()
    return { error: null }
  }

  return { rates, loading, error, createRate, updateRate, deleteRate }
}
