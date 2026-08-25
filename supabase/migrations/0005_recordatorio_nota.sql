-- Recordatorios: además de los que se generan solos al entregar un
-- tratamiento (mantenimiento/renovación), el usuario puede anotar un
-- recordatorio libre para su marca (grabar contenido, pagar factura de
-- luz, hablarle a un proveedor, etc). Estos no tienen cliente/vehículo:
-- cliente_id y vehiculo_id ya eran nullable, solo hace falta sumar el
-- tipo "nota" al check y una columna de texto libre para el motivo.
alter table recordatorios drop constraint if exists recordatorios_tipo_check;
alter table recordatorios add constraint recordatorios_tipo_check
  check (tipo in ('mantenimiento', 'renovacion', 'nota'));

alter table recordatorios add column if not exists titulo text;
