-- ---------------------------------------------------------------------------
-- "Interesado - en evaluación" se elimina como estado de seguimiento porque
-- significaba lo mismo que "Cotización enviada" — los contactos que ya tenían
-- ese estado pasan a "Cotización enviada". La fecha de vencimiento de la
-- cotización (quote_expiry_date) no se puede inventar aquí: hay que entrar a
-- editar cada uno de esos contactos y completarla manualmente.
-- ---------------------------------------------------------------------------

update contacts
set status = 'Cotización enviada'
where status = 'Interesado - en evaluación';
