-- Configuración editable del negocio (antes hardcodeada en el código):
-- horarios de atención por día y categorías de movimientos por marca.
-- Fila única ("global") — no hay multi-tenant, es un solo negocio.
create table if not exists configuracion (
  id text primary key default 'global',
  horarios jsonb not null,
  categorias_movimiento jsonb not null,
  updated_at timestamptz not null default now()
);

alter table configuracion enable row level security;
drop policy if exists "autenticados_acceso_total" on configuracion;
create policy "autenticados_acceso_total" on configuracion for all
  to authenticated using (true) with check (true);
grant select, insert, update, delete on table configuracion to authenticated;

-- Seed con los valores que ya estaban hardcodeados (ESPECIFICACION.md §6.4 y §6.7.1).
insert into configuracion (id, horarios, categorias_movimiento)
values (
  'global',
  '{
    "lunes":     {"cerrado": false, "desde": "09:00", "hasta": "18:00"},
    "martes":    {"cerrado": false, "desde": "09:00", "hasta": "18:00"},
    "miercoles": {"cerrado": false, "desde": "09:00", "hasta": "18:00"},
    "jueves":    {"cerrado": false, "desde": "09:00", "hasta": "18:00"},
    "viernes":   {"cerrado": false, "desde": "09:00", "hasta": "18:00"},
    "sabado":    {"cerrado": false, "desde": "10:00", "hasta": "13:00"},
    "domingo":   {"cerrado": true,  "desde": "09:00", "hasta": "18:00"}
  }'::jsonb,
  '{
    "ingreso": {
      "detailing": ["Servicios"],
      "shop": ["Venta de productos"],
      "classmotor": ["Ganancia por auto vendido"],
      "compartido": []
    },
    "egreso": {
      "detailing": ["Insumos", "Productos de trabajo", "Sueldos"],
      "shop": ["Compra de mercadería", "Pauta"],
      "classmotor": ["Pauta", "Compra de autos", "Patentamientos", "Arreglos", "Transferencia", "Productos para reparar"],
      "compartido": ["Alquiler", "Luz", "Agua", "Servicios", "Equipo de marketing/comunicación"]
    }
  }'::jsonb
)
on conflict (id) do nothing;
