-- =====================================================================
-- Agenda online: anticipación para reservar, por servicio.
--
-- Los servicios rápidos (lavado, limpiezas, llantas, ópticas) se pueden
-- reservar en el día, con 2 horas de anticipación como mínimo. Los
-- demás (PPF, cerámico, acrílico, polarizado, sacabollo) necesitan al
-- menos 1 día: antes hay que hablar por WhatsApp y comprar productos.
-- Vacío = usa la anticipación general de Config.
--
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

alter table servicios
  add column if not exists anticipacion_valor integer,
  add column if not exists anticipacion_unidad text;

alter table servicios drop constraint if exists servicios_anticipacion_check;
alter table servicios add constraint servicios_anticipacion_check check (
  (anticipacion_valor is null and anticipacion_unidad is null)
  or (anticipacion_valor >= 0 and anticipacion_unidad in ('horas', 'dias'))
);

-- Valores iniciales (respuesta de Joaco). Solo se cargan donde todavía
-- no hay nada, para no pisar lo que se edite desde el CRM.
update servicios
  set anticipacion_valor = 2, anticipacion_unidad = 'horas'
  where anticipacion_valor is null
    and (nombre ilike 'lavado premium%'
      or nombre ilike 'limpieza de interior%'
      or nombre ilike 'limpieza de motor%'
      or nombre ilike 'restauraci_n de llantas%'
      or nombre ilike 'restauraci_n de _pticas%');

update servicios
  set anticipacion_valor = 1, anticipacion_unidad = 'dias'
  where anticipacion_valor is null and reserva_online <> 'no';
