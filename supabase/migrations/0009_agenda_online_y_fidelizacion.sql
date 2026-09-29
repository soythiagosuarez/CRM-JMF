-- Agenda online (reservas públicas por link / web) + fidelización por
-- puntos manejada desde Clientes (propuesta 2). Datos cargados según el
-- relevamiento que respondió Joaco (septiembre 2026).
--
-- La página pública /reservar no usa el login compartido: lee y escribe
-- desde el servidor con la service role key (ver lib/supabase/admin.ts),
-- así que no hace falta abrir ninguna tabla al rol anónimo.

-- ---------------------------------------------------------------------
-- Servicios: lo que la agenda necesita para mostrar precios, calcular
-- lugar en el taller y respetar los límites por tipo de servicio.
-- ---------------------------------------------------------------------
alter table servicios
  -- si = se reserva directo · consulta = se reserva pero queda "a
  -- confirmar" hasta hablar por WhatsApp · no = no aparece en la agenda
  add column if not exists reserva_online text not null default 'no'
    check (reserva_online in ('si', 'consulta', 'no')),
  add column if not exists moneda text not null default 'ARS'
    check (moneda in ('ARS', 'USD')),
  -- precio_referencia pasa a ser el "precio desde"; precio_hasta es el
  -- tope cuando el precio varía.
  add column if not exists precio_hasta numeric,
  -- [{ nombre, precio, precio_hasta?, unidad?, duracion_valor?, duracion_unidad? }]
  -- unidad: si el precio es "por llanta", etc. (el cliente elige cantidad).
  add column if not exists variantes jsonb not null default '[]'::jsonb,
  add column if not exists duracion_valor int,
  add column if not exists duracion_unidad text
    check (duracion_unidad in ('horas', 'dias')),
  add column if not exists limite_dia int,
  add column if not exists limite_semana int,
  -- básico = suma puntos (1 cada $5.000) · premium = PPF, cerámico y
  -- acrílico: no suman puntos y tienen premios propios.
  add column if not exists categoria_fidelizacion text not null default 'basico'
    check (categoria_fidelizacion in ('basico', 'premium'));

-- Catálogo real (respuestas 4.1 y 5.3). Solo se carga en servicios que
-- todavía no tienen variantes, para no pisar ediciones hechas en el CRM.
update servicios set
  reserva_online = 'consulta', moneda = 'USD', categoria_fidelizacion = 'premium',
  precio_referencia = 300, precio_hasta = 4000,
  duracion_valor = 7, duracion_unidad = 'dias', limite_semana = 1,
  tiempo_estimado = '1 a 7 días',
  variantes = '[
    {"nombre": "Combo básico (manijas, filos de puerta, interiores, pantalla multimedia y patente)", "precio": 300, "duracion_valor": 1, "duracion_unidad": "dias"},
    {"nombre": "Full front", "precio": 1800, "duracion_valor": 3, "duracion_unidad": "dias"},
    {"nombre": "Cobertura completa", "precio": 3000, "precio_hasta": 4000, "duracion_valor": 7, "duracion_unidad": "dias"}
  ]'::jsonb
where nombre = 'PPF' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'consulta', categoria_fidelizacion = 'premium',
  precio_referencia = 900000, precio_hasta = 1550000,
  duracion_valor = 4, duracion_unidad = 'dias', limite_semana = 2,
  tiempo_estimado = '4 días',
  variantes = '[
    {"nombre": "Gtechnic C1 (2 años)", "precio": 900000},
    {"nombre": "Gtechnic EXO v5 (2 años)", "precio": 900000},
    {"nombre": "Crystal Serum Light (3 años)", "precio": 1550000},
    {"nombre": "C1 + EXO v5 (5 años)", "precio": 1350000},
    {"nombre": "Crystal Serum Light + EXO v5 (5 años)", "precio": 1550000}
  ]'::jsonb
where nombre = 'Tratamiento cerámico' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'consulta', categoria_fidelizacion = 'premium',
  precio_referencia = 580000, precio_hasta = 650000,
  duracion_valor = 4, duracion_unidad = 'dias', limite_semana = 2,
  tiempo_estimado = '4 días',
  variantes = '[
    {"nombre": "Sellador Sonax Profiline (6 meses)", "precio": 580000},
    {"nombre": "Menzerna Power Lock (6 meses)", "precio": 580000},
    {"nombre": "Sellador Wolfgang (12 meses)", "precio": 650000}
  ]'::jsonb
where nombre = 'Tratamiento acrílico' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 60000, precio_hasta = null,
  duracion_valor = 4, duracion_unidad = 'horas', limite_dia = 4,
  tiempo_estimado = '4 horas',
  variantes = '[
    {"nombre": "Lavado premium", "precio": 60000},
    {"nombre": "Lavado premium + cera en pasta (6 meses de protección)", "precio": 85000}
  ]'::jsonb
where nombre = 'Lavado premium' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 300000, precio_hasta = null,
  duracion_valor = 1, duracion_unidad = 'dias', limite_dia = 2, limite_semana = 4,
  tiempo_estimado = '1 día'
where nombre = 'Limpieza de interior full' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 100000, precio_hasta = null,
  duracion_valor = 5, duracion_unidad = 'horas', limite_dia = 2, limite_semana = 4,
  tiempo_estimado = '5 horas'
where nombre = 'Limpieza de motor' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 140000, precio_hasta = null,
  duracion_valor = 1, duracion_unidad = 'dias', limite_dia = 2,
  tiempo_estimado = '1 día',
  variantes = '[
    {"nombre": "Con sellado cerámico", "precio": 140000},
    {"nombre": "Con PPF", "precio": 250000}
  ]'::jsonb
where nombre = 'Restauración de ópticas' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'consulta', precio_referencia = 120000, precio_hasta = 800000,
  duracion_valor = 1, duracion_unidad = 'dias', limite_dia = 1,
  tiempo_estimado = '1 día',
  descripcion = coalesce(descripcion, 'El precio depende del bollo.')
where nombre = 'Sacabollo' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 290000, precio_hasta = null,
  duracion_valor = 1, duracion_unidad = 'dias', limite_dia = 1,
  tiempo_estimado = '1 día',
  variantes = '[
    {"nombre": "Normal", "precio": 290000},
    {"nombre": "Antivandálico", "precio": 350000},
    {"nombre": "Nano carbono", "precio": 450000}
  ]'::jsonb
where nombre = 'Polarizado' and variantes = '[]'::jsonb;

update servicios set
  reserva_online = 'si', precio_referencia = 85000, precio_hasta = null,
  duracion_valor = 4, duracion_unidad = 'dias', limite_semana = 1,
  tiempo_estimado = '4 días',
  variantes = '[
    {"nombre": "Llantas normales", "precio": 85000, "unidad": "llanta"},
    {"nombre": "Llantas diamantadas", "precio": 110000, "unidad": "llanta"}
  ]'::jsonb
where nombre = 'Restauración de llantas' and variantes = '[]'::jsonb;

-- ---------------------------------------------------------------------
-- Vehículos: tamaño y 0 km/usado (obligatorios en la agenda online).
-- ---------------------------------------------------------------------
alter table vehiculos
  add column if not exists tamano text
    check (tamano in ('chico', 'mediano', 'suv', 'pickup', 'grande')),
  add column if not exists condicion text
    check (condicion in ('0km', 'usado'));

-- ---------------------------------------------------------------------
-- Clientes: celular normalizado para reconocer a un cliente que ya vino
-- (últimos 10 dígitos: "+54 9 11 6972-8834" y "1169728834" son el mismo)
-- y permiso para mandarle promociones por WhatsApp.
-- ---------------------------------------------------------------------
alter table clientes
  add column if not exists telefono_norm text,
  add column if not exists acepta_promos boolean not null default false;

create or replace function clientes_normalizar_telefono() returns trigger
language plpgsql as $$
begin
  new.telefono_norm := nullif(right(regexp_replace(coalesce(new.telefono, ''), '\D', '', 'g'), 10), '');
  return new;
end;
$$;

drop trigger if exists clientes_telefono_norm on clientes;
create trigger clientes_telefono_norm
  before insert or update of telefono on clientes
  for each row execute function clientes_normalizar_telefono();

update clientes
  set telefono_norm = nullif(right(regexp_replace(coalesce(telefono, ''), '\D', '', 'g'), 10), '');

create index if not exists clientes_telefono_norm_idx on clientes(telefono_norm);

-- ---------------------------------------------------------------------
-- Turnos: reservas online, franja de ingreso, fecha estimada de listo,
-- estados "a confirmar" y "no vino".
-- ---------------------------------------------------------------------
alter table turnos drop constraint if exists turnos_estado_check;
alter table turnos add constraint turnos_estado_check
  check (estado in ('agendado', 'a_confirmar', 'ingresado', 'cancelado', 'no_vino'));

alter table turnos
  add column if not exists origen text not null default 'crm'
    check (origen in ('crm', 'online')),
  -- fin de la franja de ingreso (el inicio es "hora")
  add column if not exists hora_hasta time,
  -- último día que el auto ocupa lugar en el taller (se usa para calcular
  -- disponibilidad y para decirle al cliente cuándo estaría listo)
  add column if not exists fecha_fin_estimada date,
  add column if not exists codigo text unique,
  add column if not exists puerta_a_puerta boolean not null default false,
  -- cómo nos conoció (lo elige el cliente al reservar)
  add column if not exists canal text,
  -- [{ servicio_id, nombre, variante, cantidad, precio_texto }]
  add column if not exists servicios_detalle jsonb not null default '[]'::jsonb,
  add column if not exists precio_estimado text,
  add column if not exists notas text,
  -- cuándo se cerró la alerta de "reserva nueva" en Inicio
  add column if not exists revisado_en timestamptz;

create index if not exists turnos_estado_idx on turnos(estado);

-- ---------------------------------------------------------------------
-- Configuración de la agenda online y de la fidelización.
-- ---------------------------------------------------------------------
alter table configuracion
  add column if not exists reservas jsonb not null default '{
    "whatsapp": "5491169728834",
    "direccion": "Ituzaingó 1343, San Fernando",
    "indicaciones": [
      "Te recomendamos no dejar objetos personales dentro del auto: facilita la limpieza.",
      "El timbre del taller no funciona: avisanos por WhatsApp o aplaudí cuando llegues."
    ],
    "franjas": {
      "lunes":     [{"desde": "09:00", "hasta": "13:00"}, {"desde": "14:00", "hasta": "18:00"}],
      "martes":    [{"desde": "09:00", "hasta": "13:00"}, {"desde": "14:00", "hasta": "18:00"}],
      "miercoles": [{"desde": "09:00", "hasta": "13:00"}, {"desde": "14:00", "hasta": "18:00"}],
      "jueves":    [{"desde": "09:00", "hasta": "13:00"}, {"desde": "14:00", "hasta": "18:00"}],
      "viernes":   [{"desde": "09:00", "hasta": "13:00"}, {"desde": "14:00", "hasta": "18:00"}],
      "sabado":    [{"desde": "09:00", "hasta": "13:00"}],
      "domingo":   []
    },
    "capacidad_taller": 5,
    "anticipacion_min_dias": 1,
    "anticipacion_max_dias": 60,
    "max_pendientes_por_celular": 2
  }'::jsonb,
  add column if not exists fidelizacion jsonb not null default '{
    "pesos_por_punto": 5000,
    "reaviso_dias": 15,
    "puntos_por_motivo": {}
  }'::jsonb;

-- ---------------------------------------------------------------------
-- Días / franjas bloqueados (vacaciones, feriados, eventos, taller lleno)
-- ---------------------------------------------------------------------
create table if not exists agenda_bloqueos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  -- null = todo el día; si no, el inicio de la franja bloqueada
  franja_desde time,
  motivo text,
  created_at timestamptz not null default now()
);

create index if not exists agenda_bloqueos_fecha_idx on agenda_bloqueos(fecha);

-- ---------------------------------------------------------------------
-- Fidelización: catálogo de premios, movimientos de puntos y avisos
-- ---------------------------------------------------------------------
create table if not exists premios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  puntos int not null check (puntos > 0),
  condiciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into premios (nombre, puntos, condiciones)
select * from (values
  ('1 lavado premium gratis', 50, null),
  ('Limpieza de motor gratis', 100, null),
  ('10% off en cualquier servicio', 150, 'No aplica a PPF, Tratamiento cerámico ni Tratamiento acrílico.'),
  ('30% off en cualquier servicio', 275, 'No aplica a PPF, Tratamiento cerámico ni Tratamiento acrílico.'),
  ('20% off en servicios premium', 275, 'Solo aplica a PPF, Tratamiento cerámico o Tratamiento acrílico.'),
  ('Combo esencial PPF gratis', 350, null)
) as datos(nombre, puntos, condiciones)
where not exists (select 1 from premios);

-- Libro de puntos: el saldo de un cliente es la suma de "puntos".
create table if not exists puntos_movimientos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  puntos int not null,
  tipo text not null check (tipo in ('servicio', 'reserva_online', 'manual', 'canje')),
  motivo text,
  orden_id uuid references ordenes(id) on delete set null,
  premio_id uuid references premios(id) on delete set null,
  premio_nombre text,
  -- solo canjes: pendiente de usar / usado en un turno
  canje_estado text check (canje_estado in ('pendiente', 'usado')),
  canje_usado_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists puntos_movimientos_cliente_idx on puntos_movimientos(cliente_id);
-- Una orden cobrada suma puntos una sola vez (por tipo).
create unique index if not exists puntos_movimientos_orden_tipo_idx
  on puntos_movimientos(orden_id, tipo)
  where orden_id is not null and tipo in ('servicio', 'reserva_online');

-- Cada vez que se le avisa a un cliente que tiene premios para canjear.
create table if not exists fidelizacion_avisos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  saldo_al_avisar int not null,
  respuesta text check (respuesta in ('acepta', 'guarda', 'no_interesa')),
  -- saldo después de registrar la respuesta (si aceptó, ya descontado el canje)
  saldo_post int,
  respondido_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists fidelizacion_avisos_cliente_idx on fidelizacion_avisos(cliente_id);

-- ---------------------------------------------------------------------
-- Seguridad: mismas reglas que el resto (login compartido, §2).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array['agenda_bloqueos', 'premios', 'puntos_movimientos', 'fidelizacion_avisos'])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "autenticados_acceso_total" on %I;', t);
    execute format(
      'create policy "autenticados_acceso_total" on %I for all to authenticated using (true) with check (true);',
      t
    );
    execute format('grant select, insert, update, delete on table %I to authenticated;', t);
  end loop;

  -- La agenda pública (/reservar) trabaja desde el servidor con la
  -- service role, que saltea RLS pero igual necesita el privilegio de
  -- tabla.
  for t in
    select unnest(array[
      'clientes', 'vehiculos', 'servicios', 'turnos', 'ordenes',
      'configuracion', 'agenda_bloqueos'
    ])
  loop
    execute format('grant select, insert, update, delete on table %I to service_role;', t);
  end loop;
end $$;
