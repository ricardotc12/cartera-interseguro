-- ---------------------------------------------------------------------------
-- Cotizador referencial de pre-asesoría (herramienta separada de la cartera de
-- afiliados/cobranza/incentivos): tarifas de referencia de seguro de vida con
-- devolución, para orientar a un cliente ANTES de hacer la cotización oficial.
-- No participa en ningún cálculo de incentivo ni de cobranza.
--
-- age_min/age_max: un rango de edad (ej. 30-35) o una edad exacta cuando
-- age_min = age_max (ej. 32-32), para poder registrar un valor distinto para
-- una edad puntual dentro de un rango más amplio sin reemplazarlo.
-- ---------------------------------------------------------------------------

create table quote_rates (
  id uuid primary key default gen_random_uuid(),
  age_min int not null check (age_min between 18 and 60),
  age_max int not null check (age_max between 18 and 60),
  product text not null,
  plan text not null,
  protection_type text not null check (protection_type in ('basica', 'invalidez', 'integral')),
  coverage_years int not null check (coverage_years > 0),
  prima_mensual numeric(14, 2) check (prima_mensual is null or prima_mensual >= 0),
  prima_anual numeric(14, 2) check (prima_anual is null or prima_anual >= 0),
  monto_asegurado numeric(14, 2) check (monto_asegurado is null or monto_asegurado >= 0),
  pct_devolucion numeric(6, 4) check (pct_devolucion is null or pct_devolucion >= 0),
  total_devolucion numeric(14, 2) check (total_devolucion is null or total_devolucion >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  check (age_max >= age_min)
);

create trigger quote_rates_set_updated_at before update on quote_rates
  for each row execute function set_updated_at();
create trigger quote_rates_audit after insert or update or delete on quote_rates
  for each row execute function audit_trigger_fn();

alter table quote_rates enable row level security;
create policy "quote_rates_owner_select" on quote_rates for select to authenticated using (created_by = auth.uid());
create policy "quote_rates_owner_insert" on quote_rates for insert to authenticated with check (created_by = auth.uid());
create policy "quote_rates_owner_update" on quote_rates for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "quote_rates_owner_delete" on quote_rates for delete to authenticated using (created_by = auth.uid());

create index quote_rates_lookup_idx on quote_rates (product, plan, protection_type, coverage_years, age_min, age_max);
