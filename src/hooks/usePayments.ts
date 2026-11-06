import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { createHookContext } from '@/lib/createHookContext'
import { generateOwedMonths, defaultDueDateForMonth, effectiveFirstOwedMonth, modalidadStepMonths, calculateTenureMonths } from '@/domain'
import { today } from '@/lib/date'
import type { Affiliate, AffiliateStatus, CoverageCode, Modalidad, Payment, PaymentStatus, Policy, PolicyCoverage } from '@/types/domain'

export interface PaymentWithContext extends Payment {
  policy: Policy
  affiliate: Affiliate
}

export interface PaymentUpdateInput {
  status: PaymentStatus
  paidAmount: number | null
  paymentDate: string | null
  expectedAmount: number
  isRescheduled: boolean
  paymentMethod: string | null
  operationNumber: string | null
  dueDate: string | null
  observation: string | null
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

interface AffiliateRow {
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
}

interface PaymentRow {
  id: string
  policy_id: string
  year_month: string
  expected_amount: number
  paid_amount: number | null
  payment_date: string | null
  status: PaymentStatus
  is_rescheduled: boolean
  payment_method: string | null
  operation_number: string | null
  due_date: string | null
  observation: string | null
  policies: (PolicyRow & { affiliates: AffiliateRow }) | null
}

function mapAffiliate(row: AffiliateRow): Affiliate {
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
  }
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

function mapPayment(row: PaymentRow): PaymentWithContext | null {
  if (!row.policies) return null
  return {
    id: row.id,
    policyId: row.policy_id,
    yearMonth: row.year_month,
    expectedAmount: row.expected_amount,
    paidAmount: row.paid_amount,
    paymentDate: row.payment_date,
    status: row.status,
    isRescheduled: row.is_rescheduled,
    paymentMethod: row.payment_method,
    operationNumber: row.operation_number,
    dueDate: row.due_date,
    observation: row.observation,
    policy: mapPolicy(row.policies),
    affiliate: mapAffiliate(row.policies.affiliates),
  }
}

function usePaymentsImpl() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)

    // 1. Genera las cuotas de cobranza que aún no existan para pólizas que corresponden:
    //    activas/pendientes (cada cuántos meses le toca según su modalidad) y también las
    //    ANULADAS, pero solo hasta cumplir 12 meses desde su Fecha de Emisión — una póliza
    //    anulada sigue "arrastrando" cuotas (recaudado 0) durante su primer año para el
    //    cálculo de ICV (confirmado contra el reporte oficial de Interseguro), y después deja
    //    de generarlas.
    const { data: billablePolicies, error: policiesError } = await supabase
      .from('policies')
      .select('id, collection_amount, start_date, modalidad, status')
      .in('status', ['activo', 'pendiente', 'cancelado'])

    if (policiesError) {
      setError(policiesError.message)
      setLoading(false)
      return
    }

    const referenceDate = today()
    const rowsToEnsure = (billablePolicies ?? []).flatMap((policy) => {
      const months = generateOwedMonths(effectiveFirstOwedMonth(policy.start_date), referenceDate, modalidadStepMonths(policy.modalidad))
      const eligibleMonths =
        policy.status === 'cancelado' ? months.filter((m) => calculateTenureMonths(policy.start_date, m) < 12) : months
      return eligibleMonths.map((yearMonth) => ({
        policy_id: policy.id,
        year_month: yearMonth,
        expected_amount: policy.collection_amount,
        status: 'no_pagado' as PaymentStatus,
        is_rescheduled: false,
        due_date: defaultDueDateForMonth(yearMonth),
        created_by: user.id,
      }))
    })

    if (rowsToEnsure.length > 0) {
      const { error: upsertError } = await supabase
        .from('payments')
        .upsert(rowsToEnsure, { onConflict: 'policy_id,year_month', ignoreDuplicates: true })
      if (upsertError) {
        setError(upsertError.message)
        setLoading(false)
        return
      }
    }

    // 2. Carga todos los pagos (de cualquier póliza, incluidas inactivas/canceladas) para su consulta.
    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*, policies(*, policy_coverages(*), affiliates(*))')
      .order('year_month', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPayments(((data as unknown as PaymentRow[]) ?? []).map(mapPayment).filter((p): p is PaymentWithContext => p !== null))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function updatePayment(id: string, input: PaymentUpdateInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: input.status,
        paid_amount: input.paidAmount,
        payment_date: input.paymentDate,
        expected_amount: input.expectedAmount,
        is_rescheduled: input.isRescheduled,
        payment_method: input.paymentMethod,
        operation_number: input.operationNumber,
        due_date: input.dueDate,
        observation: input.observation,
        updated_by: user.id,
      })
      .eq('id', id)

    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }

  return { payments, loading, error, refresh, updatePayment }
}

export const [PaymentsProvider, usePayments] = createHookContext(usePaymentsImpl, 'usePayments')
