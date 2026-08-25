-- Classmotor: mismo sistema de cliente existente/nuevo que Detailing, más
-- fecha y hora de ingreso explícitas (antes fecha_ingreso se ponía sola en
-- el momento de cargar, sin elegirla, y no había hora ni cliente).
alter table autos_classmotor
  add column if not exists cliente_id uuid references clientes(id),
  add column if not exists hora_ingreso time;

-- Clientes: para separar "Clientes Detailing" de "Clientes Classmotor"
-- (ahora Classmotor también genera clientes propios).
alter table clientes
  add column if not exists origen text check (origen in ('detailing', 'classmotor'));

-- Los clientes que ya existían vinieron todos del flujo de Detailing (fue
-- la única marca que generaba clientes hasta ahora).
update clientes set origen = 'detailing' where origen is null;
