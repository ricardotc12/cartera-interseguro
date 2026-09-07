export type PeriodStatus = 'draft' | 'active' | 'closed'

export type AffiliateStatus = 'activo' | 'pendiente' | 'inactivo' | 'cancelado'

export interface Affiliate {
  id: string
  dni: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  affiliationDate: string
  status: AffiliateStatus
  observations: string | null
  createdAt: string
  updatedAt: string
}

export interface Policy {
  id: string
  affiliateId: string
  policyNumber: string
  affiliationAmount: number
  startDate: string
  status: AffiliateStatus
  createdAt: string
  updatedAt: string
}

export interface IncentivePeriod {
  id: string
  name: string
  startDate: string // ISO date, inclusive
  endDate: string // ISO date, inclusive
  status: PeriodStatus
  vidaEmissionGoal: number
  vidaEmissionMultiplier: number
  icvGoal: number | null
  collectionGoal: number | null
  notes: string | null
}

/** A tier rule with an inclusive lower bound and an optional (null = unbounded) inclusive upper bound. */
export interface RangeRule {
  id: string
  periodId: string
  min: number
  max: number | null
  sortOrder: number
}

export interface IncentiveRule extends RangeRule {
  percentage: number // e.g. 0.13 for 13%
}

export interface CollectionFactorRule extends RangeRule {
  factor: number
}

export interface IcvFactorRule extends RangeRule {
  factor: number
}

export type PaymentStatus = 'pagado' | 'no_pagado' | 'pendiente_confirmar' | 'no_corresponde'

export interface Payment {
  id: string
  policyId: string
  yearMonth: string // ISO date, first day of month
  expectedAmount: number
  paidAmount: number | null
  paymentDate: string | null
  status: PaymentStatus
  isRescheduled: boolean
  paymentMethod: string | null
  operationNumber: string | null
  dueDate: string | null
  observation: string | null
}

export interface IcvRecord {
  id: string
  periodId: string
  icvPercentage: number // puntos porcentuales, 0-100
  notes: string | null
}

/** Registro manual de un mes ya pagado por Interseguro antes de usar el sistema de períodos (sección "historial de sueldos"). No participa en ningún cálculo de incentivo, es solo para ver la evolución de ingresos en el tiempo. */
export interface HistoricalIncome {
  id: string
  yearMonth: string // 'YYYY-MM-01'
  amount: number
  notes: string | null
}

export interface GoalProgress {
  goal: number
  actual: number
  compliancePct: number // actual / goal, e.g. 1.0715 = 107.15%
  remaining: number // max(goal - actual, 0)
}
