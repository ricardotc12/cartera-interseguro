-- ---------------------------------------------------------------------------
-- Backfill de fecha de vencimiento (sección 20 + confirmación de la asesora):
-- el día de corte de cada mes de cobranza es el 15 de ese mismo mes. Los
-- pagos generados antes de que la app empezara a fijar due_date
-- automáticamente quedaron con due_date en null; sin esa fecha, la app no
-- puede distinguir "pendiente" (aún no vence) de "no pagado" (ya venció).
-- ---------------------------------------------------------------------------

update payments
set due_date = (year_month + interval '14 days')::date
where due_date is null;
