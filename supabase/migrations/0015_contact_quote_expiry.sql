-- ---------------------------------------------------------------------------
-- quote_expiry_date: fecha de vencimiento de la cotización enviada a un contacto
-- (las cotizaciones de Interseguro tienen un tiempo de validez limitado). Se usa
-- para avisar unos días antes de que venza y así poder renovarla a tiempo, igual
-- que next_contact_date — no participa en ningún cálculo de incentivo/cobranza.
-- ---------------------------------------------------------------------------

alter table contacts
  add column quote_expiry_date date;
