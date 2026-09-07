// Tipos generados a mano a partir de supabase/migrations/0001_initial_schema.sql.
// Si el esquema cambia, actualizar este archivo (o regenerarlo con `supabase gen types`).

export type PeriodStatusDb = 'draft' | 'active' | 'closed'
export type AffiliateStatusDb = 'activo' | 'pendiente' | 'inactivo' | 'cancelado'
export type PaymentStatusDb = 'pagado' | 'no_pagado' | 'pendiente_confirmar' | 'no_corresponde'

type IncentivePeriodRow = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: PeriodStatusDb
  vida_emission_goal: number
  vida_emission_multiplier: number
  icv_goal: number | null
  collection_goal: number | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type IncentiveRuleRow = {
  id: string
  period_id: string
  min_amount: number
  max_amount: number | null
  percentage: number
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type CollectionFactorRuleRow = {
  id: string
  period_id: string
  min_ratio: number
  max_ratio: number | null
  factor: number
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type IcvFactorRuleRow = {
  id: string
  period_id: string
  min_ratio: number
  max_ratio: number | null
  factor: number
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type AffiliateRow = {
  id: string
  dni: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  affiliation_date: string
  status: AffiliateStatusDb
  observations: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type PolicyRow = {
  id: string
  affiliate_id: string
  policy_number: string
  affiliation_amount: number
  start_date: string
  status: AffiliateStatusDb
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type PaymentRow = {
  id: string
  policy_id: string
  year_month: string
  expected_amount: number
  paid_amount: number | null
  payment_date: string | null
  status: PaymentStatusDb
  is_rescheduled: boolean
  payment_method: string | null
  operation_number: string | null
  due_date: string | null
  observation: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type IcvRecordRow = {
  id: string
  period_id: string
  icv_percentage: number
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type HistoricalIncomeRow = {
  id: string
  year_month: string
  amount: number
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string | null
}

type AuditLogRow = {
  id: string
  table_name: string
  record_id: string
  action: 'insert' | 'update' | 'delete'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

/** Filas generadas automáticamente por la DB que la app nunca inserta/actualiza directamente. */
type ReadOnlyInsert<Row> = Row
type ReadOnlyUpdate<Row> = Partial<Row>

/** Las columnas nullable (sin NOT NULL) se vuelven opcionales al insertar: la DB las deja en NULL si se omiten. */
type NullableOptional<T> = { [K in keyof T as null extends T[K] ? K : never]?: T[K] } & {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
}

type WritableInsert<Row, OmitKeys extends keyof Row> = NullableOptional<Omit<Row, OmitKeys>> & { id?: string }
type WritableUpdate<Row, OmitKeys extends keyof Row> = Partial<Omit<Row, OmitKeys>>

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          show_collection_ratio: boolean
          show_icv: boolean
          created_at: string
        }
        Insert: { id: string; full_name?: string | null; role?: string; show_collection_ratio?: boolean; show_icv?: boolean }
        Update: { full_name?: string | null; role?: string; show_collection_ratio?: boolean; show_icv?: boolean }
        Relationships: []
      }
      incentive_periods: {
        Row: IncentivePeriodRow
        Insert: WritableInsert<IncentivePeriodRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<IncentivePeriodRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      incentive_rules: {
        Row: IncentiveRuleRow
        Insert: WritableInsert<IncentiveRuleRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<IncentiveRuleRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      collection_factor_rules: {
        Row: CollectionFactorRuleRow
        Insert: WritableInsert<CollectionFactorRuleRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<CollectionFactorRuleRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      icv_factor_rules: {
        Row: IcvFactorRuleRow
        Insert: WritableInsert<IcvFactorRuleRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<IcvFactorRuleRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      affiliates: {
        Row: AffiliateRow
        Insert: WritableInsert<AffiliateRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<AffiliateRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      policies: {
        Row: PolicyRow
        Insert: WritableInsert<PolicyRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<PolicyRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: [
          {
            foreignKeyName: 'policies_affiliate_id_fkey'
            columns: ['affiliate_id']
            referencedRelation: 'affiliates'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: PaymentRow
        Insert: WritableInsert<PaymentRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<PaymentRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: [
          {
            foreignKeyName: 'payments_policy_id_fkey'
            columns: ['policy_id']
            referencedRelation: 'policies'
            referencedColumns: ['id']
          },
        ]
      }
      icv_records: {
        Row: IcvRecordRow
        Insert: WritableInsert<IcvRecordRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<IcvRecordRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: [
          {
            foreignKeyName: 'icv_records_period_id_fkey'
            columns: ['period_id']
            referencedRelation: 'incentive_periods'
            referencedColumns: ['id']
          },
        ]
      }
      historical_incomes: {
        Row: HistoricalIncomeRow
        Insert: WritableInsert<HistoricalIncomeRow, 'id' | 'created_at' | 'updated_at' | 'updated_by'>
        Update: WritableUpdate<HistoricalIncomeRow, 'id' | 'created_at' | 'updated_at'>
        Relationships: []
      }
      audit_log: {
        Row: AuditLogRow
        Insert: ReadOnlyInsert<AuditLogRow>
        Update: ReadOnlyUpdate<AuditLogRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
