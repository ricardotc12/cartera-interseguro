-- ---------------------------------------------------------------------------
-- Historial de sueldos: registro manual de meses ya pagados por Interseguro
-- ANTES de empezar a usar el sistema de períodos (ej. junio-agosto, resueltos
-- aparte). No participa en ningún cálculo de incentivo ni depende de
-- incentive_periods — es solo un monto por mes para ver la evolución de
-- ingresos en el tiempo, junto a los períodos calculados en vivo hacia
-- adelante.
-- ---------------------------------------------------------------------------

create table historical_incomes (
  id uuid primary key default gen_random_uuid(),
  year_month date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (created_by, year_month),
  check (date_trunc('month', year_month) = year_month)
);

create trigger historical_incomes_set_updated_at before update on historical_incomes
  for each row execute function set_updated_at();
create trigger historical_incomes_audit after insert or update or delete on historical_incomes
  for each row execute function audit_trigger_fn();

alter table historical_incomes enable row level security;
create policy "historical_incomes_owner_select" on historical_incomes for select to authenticated using (created_by = auth.uid());
create policy "historical_incomes_owner_insert" on historical_incomes for insert to authenticated with check (created_by = auth.uid());
create policy "historical_incomes_owner_update" on historical_incomes for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "historical_incomes_owner_delete" on historical_incomes for delete to authenticated using (created_by = auth.uid());
