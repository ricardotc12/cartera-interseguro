import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { createHookContext } from '@/lib/createHookContext'
import { usePayments } from '@/hooks/usePayments'
import { calculateCollectionAmount, calculateEmissionAmount } from '@/domain'
import type { Affiliate, AffiliateStatus, CoverageCode, Modalidad, Policy, PolicyCoverage } from '@/types/domain'

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

export interface PolicyCoverageInput {
  coverageCode: CoverageCode
  amount: number
}

export interface PolicyInput {
  policyNumber: string
  modalidad: Modalidad
  startDate: string
  /** Solo se envía cuando status es 'cancelado'; null en cualquier otro caso. */
  cancellationDate: string | null
  status: AffiliateStatus
  coverages: PolicyCoverageInput[]
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

interface PolicyCoverageRow {
  id: string
  policy_id: string
  coverage_code: CoverageCode
  amount: number
}

interface PolicyRow {
  id: string
  affiliate_id: string
  policy_number: string
  emission_amount: number
  collection_amount: number
  modalidad: Modalidad
  start_date: string
  cancellation_date: string | null
  status: AffiliateStatus
  created_at: string
  updated_at: string
  policy_coverages?: PolicyCoverageRow[]
}

function mapPolicyCoverage(row: PolicyCoverageRow): PolicyCoverage {
  return { id: row.id, policyId: row.policy_id, coverageCode: row.coverage_code, amount: row.amount }
}

function mapPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    affiliateId: row.affiliate_id,
    policyNumber: row.policy_number,
    emissionAmount: row.emission_amount,
    collectionAmount: row.collection_amount,
    modalidad: row.modalidad,
    startDate: row.start_date,
    cancellationDate: row.cancellation_date,
    status: row.status,
    coverages: (row.policy_coverages ?? []).map(mapPolicyCoverage),
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

function useAffiliatesImpl() {
  const { user } = useAuth()
  // Crear/editar/eliminar un afiliado o póliza cambia qué cuotas corresponden en Cobranza
  // (sección 19: cuotas generadas según pólizas activas) — sin esto, Cobranza seguía mostrando
  // los datos viejos hasta que la asesora recargaba la página entera.
  const { refresh: refreshPayments } = usePayments()
  const [affiliates, setAffiliates] = useState<AffiliateWithPolicies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // DataProviders monta este hook por encima de <Routes>, antes de que useAuth() termine de
    // restaurar la sesión guardada — sin este resguardo, la consulta salía disparada sin sesión
    // todavía válida (RLS la devolvía vacía) y, como no dependía de `user`, nunca se repetía: la
    // lista de Afiliados (y por lo tanto el Dashboard) quedaba vacía hasta que la asesora
    // recargaba la página entera a mano.
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('affiliates')
      .select('*, policies(*, policy_coverages(*))')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setAffiliates(((data as unknown as Parameters<typeof mapAffiliate>[0][]) ?? []).map(mapAffiliate))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Inserta las filas de policy_coverages de una póliza ya creada. */
  async function insertCoverages(policyId: string, coverages: PolicyCoverageInput[], userId: string) {
    if (coverages.length === 0) return { error: null }
    const { error: coveragesError } = await supabase.from('policy_coverages').insert(
      coverages.map((c) => ({
        policy_id: policyId,
        coverage_code: c.coverageCode,
        amount: c.amount,
        created_by: userId,
      })),
    )
    return { error: coveragesError ? friendlyError(coveragesError) : null }
  }

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

    const { data: policyRow, error: policyError } = await supabase
      .from('policies')
      .insert({
        affiliate_id: affiliateRow.id,
        policy_number: policy.policyNumber,
        emission_amount: calculateEmissionAmount(policy.coverages),
        collection_amount: calculateCollectionAmount(policy.coverages),
        modalidad: policy.modalidad,
        start_date: policy.startDate,
        cancellation_date: policy.cancellationDate,
        status: policy.status,
        created_by: user.id,
      })
      .select()
      .single()

    if (policyError || !policyRow) {
      // Evita dejar un afiliado huérfano sin póliza si el segundo insert falla.
      await supabase.from('affiliates').delete().eq('id', affiliateRow.id)
      return { error: friendlyError(policyError!) }
    }

    const coveragesResult = await insertCoverages(policyRow.id, policy.coverages, user.id)
    if (coveragesResult.error) {
      await supabase.from('affiliates').delete().eq('id', affiliateRow.id)
      return { error: coveragesResult.error }
    }

    await refresh()
    await refreshPayments()
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
    await refreshPayments()
    return { error: null }
  }

  async function createPolicy(affiliateId: string, policy: PolicyInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { data: policyRow, error: insertError } = await supabase
      .from('policies')
      .insert({
        affiliate_id: affiliateId,
        policy_number: policy.policyNumber,
        emission_amount: calculateEmissionAmount(policy.coverages),
        collection_amount: calculateCollectionAmount(policy.coverages),
        modalidad: policy.modalidad,
        start_date: policy.startDate,
        cancellation_date: policy.cancellationDate,
        status: policy.status,
        created_by: user.id,
      })
      .select()
      .single()
    if (insertError || !policyRow) return { error: friendlyError(insertError!) }

    const coveragesResult = await insertCoverages(policyRow.id, policy.coverages, user.id)
    if (coveragesResult.error) {
      await supabase.from('policies').delete().eq('id', policyRow.id)
      return { error: coveragesResult.error }
    }

    await refresh()
    await refreshPayments()
    return { error: null }
  }

  async function updatePolicy(id: string, patch: Partial<PolicyInput>) {
    if (!user) return { error: 'Debes iniciar sesión.' }

    const emissionAmount = patch.coverages !== undefined ? calculateEmissionAmount(patch.coverages) : undefined
    const collectionAmount = patch.coverages !== undefined ? calculateCollectionAmount(patch.coverages) : undefined

    const { error: updateError } = await supabase
      .from('policies')
      .update({
        ...(patch.policyNumber !== undefined && { policy_number: patch.policyNumber }),
        ...(emissionAmount !== undefined && { emission_amount: emissionAmount }),
        ...(collectionAmount !== undefined && { collection_amount: collectionAmount }),
        ...(patch.modalidad !== undefined && { modalidad: patch.modalidad }),
        ...(patch.startDate !== undefined && { start_date: patch.startDate }),
        ...(patch.cancellationDate !== undefined && { cancellation_date: patch.cancellationDate }),
        ...(patch.status !== undefined && { status: patch.status }),
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) return { error: friendlyError(updateError) }

    if (patch.coverages !== undefined) {
      // Reemplaza el set de coberturas (más simple y transparente que un diff fila por fila;
      // el historial de auditoría igual queda registrado como delete + insert).
      await supabase.from('policy_coverages').delete().eq('policy_id', id)
      const coveragesResult = await insertCoverages(id, patch.coverages, user.id)
      if (coveragesResult.error) return { error: coveragesResult.error }
    }

    if (collectionAmount !== undefined) {
      // El nuevo Monto de Cobranza solo afecta cuotas que todavía no se pagaron —
      // los meses ya pagados/confirmados no se tocan retroactivamente.
      await supabase
        .from('payments')
        .update({ expected_amount: collectionAmount, updated_by: user.id })
        .eq('policy_id', id)
        .not('status', 'in', '("pagado")')
    }

    await refresh()
    await refreshPayments()
    return { error: null }
  }

  async function deletePolicy(id: string) {
    const { error: deleteError } = await supabase.from('policies').delete().eq('id', id)
    if (deleteError) return { error: friendlyError(deleteError) }
    await refresh()
    await refreshPayments()
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

export const [AffiliatesProvider, useAffiliates] = createHookContext(useAffiliatesImpl, 'useAffiliates')
