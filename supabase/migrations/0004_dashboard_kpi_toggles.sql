-- ---------------------------------------------------------------------------
-- Toggles de visibilidad en el Dashboard para KPIs cuya fórmula real aún no
-- está confirmada (Ratio Cobranza, ICV). Se muestran ocultos por defecto y se
-- activan manualmente desde sus propias pantallas (Factor Cobranza / ICV)
-- una vez que la asesora confirme cómo se calculan oficialmente.
-- ---------------------------------------------------------------------------

alter table profiles
  add column show_collection_ratio boolean not null default false,
  add column show_icv boolean not null default false;
