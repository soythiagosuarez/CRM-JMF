-- JMF · Centro de Operaciones — esquema inicial
-- Fuente de verdad: ESPECIFICACION.md §6 (Modelo de datos)
--
-- Notas de diseño:
-- - Login compartido, un solo usuario de Supabase Auth (§2): no hay
--   columnas de "dueño" por fila; RLS solo exige estar autenticado.
-- - Todos los IDs son uuid con gen_random_uuid().
-- - Los montos de Movimiento siempre se guardan también en monto_ars
--   (regla de negocio §7.3: moneda única para totales).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 6.1 Cliente
-- ---------------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  telefono text,
  email text,
  como_llego text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6.2 Vehículo
-- ---------------------------------------------------------------------
create table if not exists vehiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  marca text,
  modelo text,
  anio int,
  patente text,
  color text,
  detalles text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehiculos_cliente_id_idx on vehiculos(cliente_id);

-- ---------------------------------------------------------------------
-- 6.3 Servicio (catálogo)
-- ---------------------------------------------------------------------
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  tiempo_estimado text,
  puerta_a_puerta boolean not null default true,
  -- lista ordenada de nombres de fase, ej. ["Lavado","Descontaminado",...]
  fases jsonb not null default '[]'::jsonb,
  precio_referencia numeric,
  mantenimiento_intervalo_meses int,
  renovacion_meses int,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6.4 Turno (Agenda) — solo turnos de servicio
-- ---------------------------------------------------------------------
create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  vehiculo_id uuid references vehiculos(id),
  -- array de servicio_id previstos
  servicios_previstos jsonb not null default '[]'::jsonb,
  fecha date not null,
  hora time not null,
  estado text not null default 'agendado'
    check (estado in ('agendado', 'ingresado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists turnos_fecha_idx on turnos(fecha);

-- ---------------------------------------------------------------------
-- 6.5 Orden (Detailing) — nace de un turno
-- ---------------------------------------------------------------------
create table if not exists ordenes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  vehiculo_id uuid references vehiculos(id),
  turno_id uuid references turnos(id),
  servicio_principal_id uuid references servicios(id),
  -- [{ servicio_id, precio }]
  servicios_adicionales jsonb not null default '[]'::jsonb,
  precio_total numeric,
  fase_actual text,
  estado text not null default 'en_cola'
    check (estado in ('en_cola', 'en_proceso', 'terminado', 'entregado')),
  -- array de: esperando_repuesto_producto | esperando_cliente | demorado
  flags jsonb not null default '[]'::jsonb,
  entrega text check (entrega in ('retira', 'puerta_a_puerta')),
  estado_pago text not null default 'pendiente'
    check (estado_pago in ('pendiente', 'cobrado')),
  medio_pago text,
  monto_cobrado numeric,
  moneda text,
  monto_ars numeric,
  fecha_cobro date,
  fecha_ingreso date,
  fecha_entrega date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ordenes_estado_idx on ordenes(estado);
create index if not exists ordenes_cliente_id_idx on ordenes(cliente_id);

-- ---------------------------------------------------------------------
-- 6.6 Lead / Presupuesto
-- ---------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  datos_vehiculo jsonb,
  origen text,
  que_observo text,
  servicios_consultados jsonb not null default '[]'::jsonb,
  -- { servicios, precios, tiempo_estimado, validez }
  presupuesto jsonb,
  pdf_url text,
  estado text not null default 'pendiente_presupuesto'
    check (estado in ('pendiente_presupuesto', 'presupuestado', 'aceptado', 'perdido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6.7 Movimiento (Finanzas) — el corazón
-- ---------------------------------------------------------------------
create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  marca text not null check (marca in ('detailing', 'shop', 'classmotor', 'compartido')),
  categoria text not null,
  monto numeric not null,
  moneda_original text not null,
  monto_ars numeric not null,
  tipo_cambio numeric,
  medio_pago text,
  fecha date not null default current_date,
  origen text not null default 'manual'
    check (origen in ('manual', 'orden', 'classmotor', 'shop')),
  ref_origen uuid,
  descripcion text,
  created_at timestamptz not null default now()
);

create index if not exists movimientos_marca_idx on movimientos(marca);
create index if not exists movimientos_fecha_idx on movimientos(fecha);

-- ---------------------------------------------------------------------
-- 6.8 Auto Classmotor (ficha)
-- ---------------------------------------------------------------------
create table if not exists autos_classmotor (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('compra_venta', 'preventa_venta')),
  marca text,
  modelo text,
  anio int,
  km int,
  patente text,
  color text,
  detalles text,
  precio_base numeric,
  precio_venta numeric,
  -- [{ concepto, monto }]
  costos_extra jsonb not null default '[]'::jsonb,
  estado text not null default 'ingresa' check (estado in (
    'ingresa',
    'en_preparacion_estetica',
    'sesion_fotos_contenido',
    'publicado_pautado',
    'cliente_viene_a_verlo',
    'vendido'
  )),
  fecha_ingreso date,
  fecha_venta date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6.9 Producto (Shop)
-- ---------------------------------------------------------------------
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  stock_actual int not null default 0,
  stock_minimo int not null default 4,
  precio_venta numeric,
  precio_costo numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6.10 Recordatorio
-- ---------------------------------------------------------------------
create table if not exists recordatorios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  vehiculo_id uuid references vehiculos(id),
  orden_id uuid references ordenes(id),
  tipo text not null check (tipo in ('mantenimiento', 'renovacion')),
  tratamiento text,
  fecha_proxima date,
  intervalo_meses int,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'hecho', 'descartado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recordatorios_fecha_proxima_idx on recordatorios(fecha_proxima);

-- ---------------------------------------------------------------------
-- Seguridad: login compartido, un solo usuario (§2).
-- RLS habilitado en todo; cualquier usuario autenticado tiene acceso
-- completo (no hay roles ni dueño por fila en el MVP).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'clientes', 'vehiculos', 'servicios', 'turnos', 'ordenes',
      'leads', 'movimientos', 'autos_classmotor', 'productos', 'recordatorios'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "autenticados_acceso_total" on %I;', t);
    execute format(
      'create policy "autenticados_acceso_total" on %I for all to authenticated using (true) with check (true);',
      t
    );
    -- El acceso real lo filtra RLS (arriba); esto solo habilita el
    -- privilegio de tabla que Postgres exige antes de evaluar RLS.
    execute format('grant select, insert, update, delete on table %I to authenticated;', t);
  end loop;
end $$;
