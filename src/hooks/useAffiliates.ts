import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Affiliate, AffiliateStatus, Policy } from '@/types/domain'

export interface AffiliateWithPolicies extends Affiliate {
  policies: Policy[]
}

export interface AffiliateInput {
  dni: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  affiliationDate: string
  status: AffiliateStatus
  observations: string | null
}

export interface PolicyInput {
  policyNumber: string
  affiliationAmount: number
  startDate: string
  status: AffiliateStatus
}

function mapAffiliate(row: {
  id: string
  dni: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  affiliation_date: string
  status: AffiliateStatus
  observations: string | null
  created_at: string
  updated_at: string
  policies?: PolicyRow[]
}): AffiliateWithPolicies {
  return {
    id: row.id,
    dni: row.dni,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    affiliationDate: row.affiliation_date,
    status: row.status,
    observations: row.observations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    policies: (row.policies ?? []).map(mapPolicy),
  }
}

interface PolicyRow {
  id: string
  affiliate_id: string
  policy_number: string
  affiliation_amount: number
  start_date: string
  status: AffiliateStatus
  created_at: string
  updated_at: string
}

function mapPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    affiliateId: row.affiliate_id,
    policyNumber: row.policy_number,
    affiliationAmount: row.affiliation_amount,
    startDate: row.start_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Traduce errores de Postgres/Supabase a mensajes entendibles para la asesora. */
function friendlyError(error: { code?: string; message: string; details?: string | null }): string {
  if (error.code === '23505') {
    if (error.message.includes('dni')) return 'Ya existe un afiliado registrado con ese DNI.'
    if (error.message.includes('policy_number')) return 'Ya existe una póliza registrada con ese número.'
    return 'Ya existe un registro con ese valor único.'
  }
  if (error.code === '23514') return 'Uno de los datos ingresados no cumple el formato requerido (revisa DNI, monto o correo).'
  return error.message
}

export function useAffiliates() {
  const { user } = useAuth()
  const [affiliates, setAffiliates] = useState<AffiliateWithPolicies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('affiliates')
      .select('*, policies(*)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAffiliates(((data as unknown as Parameters<typeof mapAffiliate>[0][]) ?? []).map(mapAffiliate))
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createAffiliateWithPolicy(affiliate: AffiliateInput, policy: PolicyInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }

    const { data: affiliateRow, error: affiliateError } = await supabase
      .from('affiliates')
      .insert({
        dni: affiliate.dni,
        first_name: affiliate.firstName,
        last_name: affiliate.lastName,
        email: affiliate.email,
        phone: affiliate.phone,
        affiliation_date: affiliate.affiliationDate,
        status: affiliate.status,
        observations: affiliate.observations,
        created_by: user.id,
      })
      .select()
      .single()

    if (affiliateError || !affiliateRow) {
      return { error: friendlyError(affiliateError!) }
    }

    const { error: policyError } = await supabase.from('policies').insert({
      affiliate_id: affiliateRow.id,
      policy_number: policy.policyNumber,
      affiliation_amount: policy.affiliationAmount,
      start_date: policy.startDate,
      status: policy.status,
      created_by: user.id,
    })

    if (policyError) {
      // Evita dejar un afiliado huérfano sin póliza si el segundo insert falla.
      await supabase.from('affiliates').delete().eq('id', affiliateRow.id)
      return { error: friendlyError(policyError) }
    }

    await refresh()
    return { error: null }
  }

  async function updateAffiliate(id: string, patch: Partial<AffiliateInput>) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({
        ...(patch.dni !== undefined && { dni: patch.dni }),
        ...(patch.firstName !== undefined && { first_name: patch.firstName }),
        ...(patch.lastName !== undefined && { last_name: patch.lastName }),
        ...(patch.email !== undefined && { email: patch.email }),
        ...(patch.phone !== undefined && { phone: patch.phone }),
        ...(patch.affiliationDate !== undefined && { affiliation_date: patch.affiliationDate }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.observations !== undefined && { observations: patch.observations }),
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) return { error: friendlyError(updateError) }
    await refresh()
    return { error: null }
  }

  async function deleteAffiliate(id: string) {
    const { error: deleteError } = await supabase.from('affiliates').delete().eq('id', id)
    if (deleteError) return { error: friendlyError(deleteError) }
    await refresh()
    return { error: null }
  }

  async function createPolicy(affiliateId: string, policy: PolicyInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: insertError } = await supabase.from('policies').insert({
      affiliate_id: affiliateId,
      policy_number: policy.policyNumber,
      affiliation_amount: policy.affiliationAmount,
      start_date: policy.startDate,
      status: policy.status,
      created_by: user.id,
    })
    if (insertError) return { error: friendlyError(insertError) }
    await refresh()
    return { error: null }
  }

  async function updatePolicy(id: string, patch: Partial<PolicyInput>) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('policies')
      .update({
        ...(patch.policyNumber !== undefined && { policy_number: patch.policyNumber }),
        ...(patch.affiliationAmount !== undefined && { affiliation_amount: patch.affiliationAmount }),
        ...(patch.startDate !== undefined && { start_date: patch.startDate }),
        ...(patch.status !== undefined && { status: patch.status }),
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) return { error: friendlyError(updateError) }
    await refresh()
    return { error: null }
  }

  async function deletePolicy(id: string) {
    const { error: deleteError } = await supabase.from('policies').delete().eq('id', id)
    if (deleteError) return { error: friendlyError(deleteError) }
    await refresh()
    return { error: null }
  }

  return {
    affiliates,
    loading,
    error,
    refresh,
    createAffiliateWithPolicy,
    updateAffiliate,
    deleteAffiliate,
    createPolicy,
    updatePolicy,
    deletePolicy,
  }
}
