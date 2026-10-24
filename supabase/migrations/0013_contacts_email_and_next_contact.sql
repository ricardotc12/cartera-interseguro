-- ---------------------------------------------------------------------------
-- Dos campos nuevos en contacts:
-- - email: para el botón "enviar correo" (abre Gmail directamente) en la lista.
-- - next_contact_date: fecha que la asesora acuerda con la persona para volver
--   a contactarla (ej. "contáctame el 25 de noviembre"). Alimenta la alerta de
--   "recontactar" — no participa en ningún cálculo de incentivo/cobranza.
-- ---------------------------------------------------------------------------

alter table contacts
  add column email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column next_contact_date date;
