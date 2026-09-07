-- ---------------------------------------------------------------------------
-- Los tramos de incentivo NO siempre son un porcentaje: Interseguro maneja
-- hoy los tramos más bajos de Emisión Vida como un MONTO FIJO en soles, y
-- solo el tramo más alto como un porcentaje real. Se agrega value_type para
-- que cada tramo declare su propio tipo, y fixed_amount para guardar el
-- monto cuando corresponda. Cuando Interseguro confirme el nuevo esquema por
-- porcentajes, cada tramo se reconfigura como 'percentage' sin migrar nada.
-- ---------------------------------------------------------------------------

alter table incentive_rules alter column percentage drop not null;
alter table incentive_rules add column fixed_amount numeric(14, 2);
alter table incentive_rules add column value_type text not null default 'percentage' check (value_type in ('percentage', 'fixed'));

alter table incentive_rules add constraint incentive_rules_value_check check (
  (value_type = 'percentage' and percentage is not null and fixed_amount is null) or
  (value_type = 'fixed' and fixed_amount is not null and percentage is null)
);
