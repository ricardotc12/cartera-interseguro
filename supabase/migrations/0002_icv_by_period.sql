-- =============================================================================
-- Corrección: el % ICV se registra una sola vez por período de incentivo
-- (no por mes calendario), porque los períodos de incentivo no coinciden con
-- meses calendario y el Factor ICV debe compararse contra las reglas ICV de
-- ese mismo período (ver sección 23 del documento maestro; decisión
-- confirmada con el usuario en la Fase 4).
-- =============================================================================

drop table if exists icv_records cascade;

create table icv_records (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references incentive_periods(id) on delete cascade,
  icv_percentage numeric(6, 3) not null check (icv_percentage >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (period_id)
);

create trigger icv_records_set_updated_at before update on icv_records
  for each row execute function set_updated_at();
create trigger icv_records_audit after insert or update or delete on icv_records
  for each row execute function audit_trigger_fn();

alter table icv_records enable row level security;
create policy "icv_records_owner_select" on icv_records for select to authenticated using (created_by = auth.uid());
create policy "icv_records_owner_insert" on icv_records for insert to authenticated with check (created_by = auth.uid());
create policy "icv_records_owner_update" on icv_records for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "icv_records_owner_delete" on icv_records for delete to authenticated using (created_by = auth.uid());
