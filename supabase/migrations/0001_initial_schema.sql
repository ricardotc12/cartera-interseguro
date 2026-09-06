-- =============================================================================
-- Esquema inicial: Sistema de Gestión de Afiliados, Cobranza, Metas e Incentivos
-- Ver plan/documento maestro para el detalle de reglas de negocio.
-- =============================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Helpers: updated_at automático y auditoría genérica (secciones 12 y 38)
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- audit_log es de solo lectura/inserción para todos los usuarios autenticados: nunca se edita ni se borra.
alter table audit_log enable row level security;
create policy "audit_log_select" on audit_log for select to authenticated using (true);
create policy "audit_log_insert" on audit_log for insert to authenticated with check (true);

create or replace function audit_trigger_fn()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    insert into audit_log (table_name, record_id, action, old_data, changed_by)
    values (tg_table_name, old.id, 'delete', to_jsonb(old), auth.uid());
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    values (tg_table_name, new.id, 'update', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  else
    insert into audit_log (table_name, record_id, action, new_data, changed_by)
    values (tg_table_name, new.id, 'insert', to_jsonb(new), auth.uid());
    return new;
  end if;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- profiles: extiende auth.users
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'asesora',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on profiles for update to authenticated using (id = auth.uid());

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- incentive_periods: cada período tiene su propio conjunto de reglas (secciones 2-9)
-- ---------------------------------------------------------------------------

create table incentive_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  vida_emission_goal numeric(14, 2) not null,
  vida_emission_multiplier numeric(10, 4) not null default 10,
  icv_goal numeric(6, 3),
  collection_goal numeric(6, 3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  check (end_date >= start_date),
  -- Un mismo usuario no puede tener dos períodos con fechas solapadas (sección 33).
  exclude using gist (created_by with =, daterange(start_date, end_date, '[]') with &&)
);

create trigger incentive_periods_set_updated_at before update on incentive_periods
  for each row execute function set_updated_at();
create trigger incentive_periods_audit after insert or update or delete on incentive_periods
  for each row execute function audit_trigger_fn();

alter table incentive_periods enable row level security;
create policy "incentive_periods_owner_select" on incentive_periods for select to authenticated using (created_by = auth.uid());
create policy "incentive_periods_owner_insert" on incentive_periods for insert to authenticated with check (created_by = auth.uid());
create policy "incentive_periods_owner_update" on incentive_periods for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "incentive_periods_owner_delete" on incentive_periods for delete to authenticated using (created_by = auth.uid());
-- Nota (Fase 4): antes de permitir borrar/editar un período con status <> 'draft' o con
-- pólizas/pagos ya calculados sobre él, la app debe bloquearlo (inmutabilidad histórica,
-- secciones 8-9). No se implementa como constraint de DB para no acoplar el esquema a
-- reglas de UI que todavía no existen; se valida en la capa de aplicación en Fase 4.

-- ---------------------------------------------------------------------------
-- Reglas versionadas por período (secciones 22-24)
-- max = null significa "en adelante" (sin límite superior).
-- ---------------------------------------------------------------------------

create table incentive_rules (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references incentive_periods(id) on delete cascade,
  min_amount numeric(14, 2) not null,
  max_amount numeric(14, 2),
  percentage numeric(6, 4) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  check (max_amount is null or max_amount >= min_amount),
  exclude using gist (period_id with =, numrange(min_amount, max_amount, '[]') with &&)
);

create table collection_factor_rules (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references incentive_periods(id) on delete cascade,
  min_ratio numeric(6, 3) not null,
  max_ratio numeric(6, 3),
  factor numeric(5, 4) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  check (max_ratio is null or max_ratio >= min_ratio),
  exclude using gist (period_id with =, numrange(min_ratio, max_ratio, '[]') with &&)
);

create table icv_factor_rules (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references incentive_periods(id) on delete cascade,
  min_ratio numeric(6, 3) not null,
  max_ratio numeric(6, 3),
  factor numeric(5, 4) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  check (max_ratio is null or max_ratio >= min_ratio),
  exclude using gist (period_id with =, numrange(min_ratio, max_ratio, '[]') with &&)
);

do $$
declare
  t text;
begin
  foreach t in array array['incentive_rules', 'collection_factor_rules', 'icv_factor_rules']
  loop
    execute format('create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at();', t, t);
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function audit_trigger_fn();', t, t);
    execute format('alter table %I enable row level security;', t);
    execute format('create policy "%I_owner_select" on %I for select to authenticated using (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_insert" on %I for insert to authenticated with check (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_update" on %I for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_delete" on %I for delete to authenticated using (created_by = auth.uid());', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- affiliates / policies / payments (secciones 17-21)
-- ---------------------------------------------------------------------------

create table affiliates (
  id uuid primary key default gen_random_uuid(),
  dni text not null check (dni ~ '^[0-9]{8}$'),
  first_name text not null,
  last_name text not null,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  affiliation_date date not null,
  status text not null default 'activo' check (status in ('activo', 'pendiente', 'inactivo', 'cancelado')),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (created_by, dni)
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  policy_number text not null,
  affiliation_amount numeric(14, 2) not null check (affiliation_amount >= 0),
  start_date date not null,
  status text not null default 'activo' check (status in ('activo', 'pendiente', 'inactivo', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (created_by, policy_number)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  year_month date not null,
  expected_amount numeric(14, 2) not null check (expected_amount >= 0),
  paid_amount numeric(14, 2) check (paid_amount is null or paid_amount >= 0),
  payment_date date,
  status text not null default 'no_pagado' check (status in ('pagado', 'no_pagado', 'pendiente_confirmar', 'no_corresponde')),
  is_rescheduled boolean not null default false,
  payment_method text,
  operation_number text,
  due_date date,
  observation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (policy_id, year_month),
  check (date_trunc('month', year_month) = year_month)
);

create table icv_records (
  id uuid primary key default gen_random_uuid(),
  year_month date not null,
  icv_percentage numeric(6, 3) not null check (icv_percentage >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (created_by, year_month),
  check (date_trunc('month', year_month) = year_month)
);

do $$
declare
  t text;
begin
  foreach t in array array['affiliates', 'policies', 'payments', 'icv_records']
  loop
    execute format('create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at();', t, t);
    execute format('create trigger %I_audit after insert or update or delete on %I for each row execute function audit_trigger_fn();', t, t);
    execute format('alter table %I enable row level security;', t);
    execute format('create policy "%I_owner_select" on %I for select to authenticated using (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_insert" on %I for insert to authenticated with check (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_update" on %I for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());', t, t);
    execute format('create policy "%I_owner_delete" on %I for delete to authenticated using (created_by = auth.uid());', t, t);
  end loop;
end $$;

create index payments_policy_year_month_idx on payments (policy_id, year_month);
create index policies_affiliate_idx on policies (affiliate_id);
