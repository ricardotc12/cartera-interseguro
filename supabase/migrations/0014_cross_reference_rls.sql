-- ---------------------------------------------------------------------------
-- Endurecer RLS para cuando haya más de una persona usando el mismo proyecto
-- de Supabase (sección "preparado para más usuarios" de la migración 0003).
--
-- Hasta ahora, las políticas de policies/payments/incentive_rules/
-- collection_factor_rules/icv_factor_rules/icv_records solo verificaban que
-- el registro fuera "mío" (created_by = auth.uid()), pero NO verificaban que
-- el registro al que apunta (affiliate_id, policy_id, period_id) también
-- fuera mío. Hoy no es explotable porque solo existe una cuenta, pero con
-- varias cuentas independientes alguien podría, en teoría, enlazar una
-- póliza/pago/regla a un afiliado/póliza/período de otra persona.
--
-- Se agrega esa verificación cruzada a insert y update de cada tabla.
-- ---------------------------------------------------------------------------

-- policies.affiliate_id debe pertenecer a un afiliado propio
drop policy if exists "policies_owner_insert" on policies;
create policy "policies_owner_insert" on policies for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from affiliates a where a.id = affiliate_id and a.created_by = auth.uid())
  );

drop policy if exists "policies_owner_update" on policies;
create policy "policies_owner_update" on policies for update to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and exists (select 1 from affiliates a where a.id = affiliate_id and a.created_by = auth.uid())
  );

-- payments.policy_id debe pertenecer a una póliza propia
drop policy if exists "payments_owner_insert" on payments;
create policy "payments_owner_insert" on payments for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from policies p where p.id = policy_id and p.created_by = auth.uid())
  );

drop policy if exists "payments_owner_update" on payments;
create policy "payments_owner_update" on payments for update to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and exists (select 1 from policies p where p.id = policy_id and p.created_by = auth.uid())
  );

-- incentive_rules/collection_factor_rules/icv_factor_rules.period_id e icv_records.period_id
-- deben pertenecer a un período propio
do $$
declare
  t text;
begin
  foreach t in array array['incentive_rules', 'collection_factor_rules', 'icv_factor_rules', 'icv_records']
  loop
    execute format('drop policy if exists "%I_owner_insert" on %I;', t, t);
    execute format(
      'create policy "%I_owner_insert" on %I for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from incentive_periods per where per.id = period_id and per.created_by = auth.uid()));',
      t, t
    );

    execute format('drop policy if exists "%I_owner_update" on %I;', t, t);
    execute format(
      'create policy "%I_owner_update" on %I for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid() and exists (select 1 from incentive_periods per where per.id = period_id and per.created_by = auth.uid()));',
      t, t
    );
  end loop;
end $$;
