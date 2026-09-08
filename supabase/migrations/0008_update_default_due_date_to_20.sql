-- ---------------------------------------------------------------------------
-- Corrección de la fecha de corte por defecto (confirmación de la asesora):
-- Interseguro cobra las pólizas el día 20 de cada mes, no el 15 como se
-- había asumido antes (migración 0005). Esto solo actualiza los pagos cuyo
-- due_date sigue en el valor por defecto anterior (el día 15 exacto del
-- mes de cobranza) — si la asesora llegó a editar manualmente la fecha de
-- vencimiento de algún pago a otro día, esa edición no se toca.
-- ---------------------------------------------------------------------------

update payments
set due_date = (year_month + interval '19 days')::date
where due_date = (year_month + interval '14 days')::date;
