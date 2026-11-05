-- =============================================================================
-- Coberturas por póliza, Monto de Emisión vs Monto de Cobranza, Modalidad,
-- fecha de cancelación y fecha de ingreso del agente (para el Bono de Recaudo).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- policies: separar Monto de Emisión (solo coberturas obligatorias) de Monto
-- de Cobranza (todas las coberturas marcadas), agregar modalidad de pago y
-- fecha de cancelación.
-- ---------------------------------------------------------------------------

alter table policies rename column affiliation_amount to emission_amount;

alter table policies add column collection_amount numeric(14, 2) not null default 0 check (collection_amount >= 0);
-- Pólizas existentes solo tenían un monto único (equivalente a solo coberturas
-- obligatorias) — Monto de Cobranza arranca igual a Monto de Emisión.
update policies set collection_amount = emission_amount;

alter table policies add column modalidad text not null default 'mensual'
  check (modalidad in ('mensual', 'trimestral', 'semestral', 'anual'));

alter table policies add column cancellation_date date;
alter table policies add constraint policies_cancellation_date_check
  check (cancellation_date is null or cancellation_date >= start_date);

-- ---------------------------------------------------------------------------
-- policy_coverages: desglose de coberturas marcadas por póliza, con el monto
-- que el agente ingresa a mano para cada una.
-- ---------------------------------------------------------------------------

create table policy_coverages (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  coverage_code text not null check (coverage_code in (
    'fallecimiento',
    'invalidez_total_adelanto_capital',
    'fallecimiento_accidente',
    'fallecimiento_accidente_transito',
    'enfermedades_graves_intervenciones',
    'enfermedades_graves_adelanto_capital',
    'invalidez_accidental'
  )),
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (policy_id, coverage_code)
);

create trigger policy_coverages_set_updated_at before update on policy_coverages
  for each row execute function set_updated_at();
create trigger policy_coverages_audit after insert or update or delete on policy_coverages
  for each row execute function audit_trigger_fn();

alter table policy_coverages enable row level security;
create policy "policy_coverages_owner_select" on policy_coverages for select to authenticated
  using (created_by = auth.uid());
create policy "policy_coverages_owner_insert" on policy_coverages for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from policies p where p.id = policy_id and p.created_by = auth.uid())
  );
create policy "policy_coverages_owner_update" on policy_coverages for update to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and exists (select 1 from policies p where p.id = policy_id and p.created_by = auth.uid())
  );
create policy "policy_coverages_owner_delete" on policy_coverages for delete to authenticated
  using (created_by = auth.uid());

create index policy_coverages_policy_idx on policy_coverages (policy_id);

-- ---------------------------------------------------------------------------
-- profiles: fecha de ingreso del agente a Interseguro (antigüedad para el
-- Bono de Recaudo del 12%).
-- ---------------------------------------------------------------------------

alter table profiles add column interseguro_start_date date;
