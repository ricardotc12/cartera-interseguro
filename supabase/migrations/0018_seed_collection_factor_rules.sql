-- =============================================================================
-- Precarga los 5 tramos de Factor Cobranza que confirmó la asesora en el
-- período actualmente activo, y activa el toggle para que el Dashboard/
-- Incentivos empiecen a usarlo. Solo inserta si ese período todavía no tiene
-- ningún tramo de cobranza cargado (no pisa nada que ya hayas configurado).
-- =============================================================================

do $$
declare
  v_period_id uuid;
  v_created_by uuid;
begin
  select id, created_by into v_period_id, v_created_by
  from incentive_periods
  where status = 'active'
  order by start_date desc
  limit 1;

  if v_period_id is not null and not exists (
    select 1 from collection_factor_rules where period_id = v_period_id
  ) then
    insert into collection_factor_rules (period_id, min_ratio, max_ratio, factor, sort_order, created_by)
    values
      (v_period_id, 0.00, 64.99, 0.00, 1, v_created_by),
      (v_period_id, 65.00, 77.99, 0.50, 2, v_created_by),
      (v_period_id, 78.00, 82.99, 0.75, 3, v_created_by),
      (v_period_id, 83.00, 85.99, 0.85, 4, v_created_by),
      (v_period_id, 86.00, null, 1.00, 5, v_created_by);
  end if;
end $$;

update profiles set show_collection_ratio = true;
