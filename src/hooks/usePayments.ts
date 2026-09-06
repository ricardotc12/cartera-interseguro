import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { generateOwedMonths } from '@/domain'
import type { Affiliate, AffiliateStatus, Payment, PaymentStatus, Policy } from '@/types/domain'

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

const today = () => new Date().toISOString().slice(0, 10)

export function usePayments() {
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

    // 1. Genera las cuotas mensuales que aún no existan para pólizas vigentes.
    const { data: activePolicies, error: policiesError } = await supabase
      .from('policies')
      .select('id, affiliation_amount, start_date')
      .in('status', ['activo', 'pendiente'])

    if (policiesError) {
      setError(policiesError.message)
      setLoading(false)
      return
    }

    const referenceDate = today()
    const rowsToEnsure = (activePolicies ?? []).flatMap((policy) =>
      generateOwedMonths(policy.start_date, referenceDate).map((yearMonth) => ({
        policy_id: policy.id,
        year_month: yearMonth,
        expected_amount: policy.affiliation_amount,
        status: 'no_pagado' as PaymentStatus,
        is_rescheduled: false,
        created_by: user.id,
      })),
    )

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
      .select('*, policies(*, affiliates(*))')
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
