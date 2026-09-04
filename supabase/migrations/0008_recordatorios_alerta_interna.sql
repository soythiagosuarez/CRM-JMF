-- Recordatorios: el aviso es una alerta DENTRO del CRM (banner en Inicio
-- que Joaco cierra para confirmar que la vio), no un envío a WhatsApp/
-- SMS/Gmail — eso requeriría pagar una API. Se saca el campo "medio" del
-- flujo (queda la columna por compatibilidad, ya no se completa) y se
-- agrega cuándo fue la última vez que se cerró la alerta, para poder
-- recalcular cuándo toca la próxima según la frecuencia.
alter table recordatorios
  add column if not exists ultimo_recordado_en timestamptz;
