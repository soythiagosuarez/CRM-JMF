-- Rediseño de Leads/Presupuestos: pasa a ser un generador de presupuestos
-- independiente, sin atarse a Cliente/Vehículo (evita crear "clientes"
-- reales antes de que el presupuesto se acepte). Cuando el cliente
-- acepta, el turno se agenda a mano desde Agenda, como cualquier otro.
--
-- La tabla "leads" es nueva (del mismo día) y sin datos reales todavía,
-- así que se reemplaza directo por "presupuestos" en vez de migrar filas.

drop table if exists leads;

create table if not exists presupuestos (
  id uuid primary key default gen_random_uuid(),
  nombre_contacto text not null,
  telefono text,
  vehiculo_marca text,
  vehiculo_modelo text,
  vehiculo_patente text,
  que_observo text,
  -- [{ nombre, precio }] — se guarda el nombre del servicio directo,
  -- sin FK, para no depender de que el servicio siga existiendo.
  servicios jsonb not null default '[]'::jsonb,
  tiempo_estimado text,
  fecha date not null default current_date,
  validez date,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptado', 'rechazado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table presupuestos enable row level security;
drop policy if exists "autenticados_acceso_total" on presupuestos;
create policy "autenticados_acceso_total" on presupuestos
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on table presupuestos to authenticated;
