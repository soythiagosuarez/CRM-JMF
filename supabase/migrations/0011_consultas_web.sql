-- =====================================================================
-- Consultas de la web: el formulario de Contacto de jmfdetailing (GitHub
-- Pages) las manda a /api/consultas del CRM, que las guarda acá con la
-- service role. En el CRM se gestionan desde la sección Consultas web.
--
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

create table if not exists consultas_web (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  -- Últimos 10 dígitos, igual que clientes.telefono_norm: sirve para ver
  -- si ya es cliente y para el tope de consultas por celular.
  telefono_norm text,
  email text,
  vehiculo text,
  servicio text,
  mensaje text,
  -- nueva → en_contacto → concretada | descartada
  estado text not null default 'nueva'
    check (estado in ('nueva', 'en_contacto', 'concretada', 'descartada')),
  notas text,
  cliente_id uuid references clientes(id) on delete set null,
  -- Hash del IP (no el IP): solo para frenar spam desde un mismo lugar.
  ip_hash text,
  origen text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultas_web_created_at_idx on consultas_web (created_at desc);
create index if not exists consultas_web_estado_idx on consultas_web (estado);
create index if not exists consultas_web_telefono_norm_idx on consultas_web (telefono_norm);
create index if not exists consultas_web_ip_hash_idx on consultas_web (ip_hash, created_at);

-- Seguridad: mismas reglas que el resto (login compartido) y la service
-- role para guardar lo que llega desde la web.
alter table consultas_web enable row level security;
drop policy if exists "autenticados_acceso_total" on consultas_web;
create policy "autenticados_acceso_total" on consultas_web
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on table consultas_web to authenticated;
grant select, insert, update, delete on table consultas_web to service_role;
