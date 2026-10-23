-- ---------------------------------------------------------------------------
-- Seguimiento de contactos: registro de personas contactadas que todavía no
-- son afiliadas (prospección), con el estado de la conversación (hubo
-- contacto, se envió cotización, no quiso la póliza, etc.). No participa en
-- ningún cálculo de incentivo/cobranza — es solo un registro de seguimiento
-- comercial, separado de la cartera de afiliados.
--
-- "status" es texto libre (no un check constraint fijo): la asesora decide y
-- amplía sus propias etapas de seguimiento desde la propia pantalla, sin
-- necesitar una migración nueva cada vez que agregue una opción.
-- ---------------------------------------------------------------------------

create table contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  dni text check (dni is null or dni ~ '^[0-9]{8}$'),
  status text not null,
  contact_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id)
);

create trigger contacts_set_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger contacts_audit after insert or update or delete on contacts
  for each row execute function audit_trigger_fn();

alter table contacts enable row level security;
create policy "contacts_owner_select" on contacts for select to authenticated using (created_by = auth.uid());
create policy "contacts_owner_insert" on contacts for insert to authenticated with check (created_by = auth.uid());
create policy "contacts_owner_update" on contacts for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "contacts_owner_delete" on contacts for delete to authenticated using (created_by = auth.uid());

create index contacts_contact_date_idx on contacts (contact_date desc);
