# Base de datos — JMF Centro de Operaciones

`migrations/0001_init.sql` crea todas las tablas de `ESPECIFICACION.md` §6:
clientes, vehículos, servicios, turnos, órdenes, leads, movimientos,
autos_classmotor, productos y recordatorios. Incluye RLS habilitado con una
política simple: cualquier usuario autenticado tiene acceso completo (login
compartido, sin roles — ver §2).

## Cómo aplicarla

**Opción A — SQL Editor (más simple, no requiere nada extra):**
1. Entrá a tu proyecto → **SQL Editor** → **New query**.
2. Pegá el contenido completo de `migrations/0001_init.sql`.
3. Run.

**Opción B — Supabase CLI**, si la tenés instalada:
```bash
supabase link --project-ref rtirokgkjgwsnfikldgs
supabase db push
```

Después de aplicarla, los módulos (Servicios, Clientes, Agenda, etc.) se
construyen leyendo/escribiendo estas tablas en vez de usar los datos de
ejemplo de `lib/mock-data.ts`.
