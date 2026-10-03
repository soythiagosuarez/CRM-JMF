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

## Agenda online y fidelización (migración 0009)

`migrations/0009_agenda_online_y_fidelizacion.sql` agrega lo necesario para
la agenda pública (`/reservar`) y los puntos de fidelización:

- Servicios: si se reservan online, moneda, opciones con precio propio,
  duración y máximo por día/semana (carga los precios que pasó Joaco).
- Vehículos: tamaño y 0 km/usado. Clientes: celular normalizado y permiso
  para promociones.
- Turnos: reservas online, estados "a confirmar" y "no vino", franja de
  ingreso y fecha estimada de listo.
- Tablas nuevas: `agenda_bloqueos`, `premios`, `puntos_movimientos`,
  `fidelizacion_avisos`.

Se aplica igual que las anteriores (SQL Editor → pegar → Run), después de
la 0008.

### Variable de entorno nueva

La agenda pública no tiene login, así que el servidor lee y escribe con la
**service role key** de Supabase:

```
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase → Project Settings → API → service_role
```

Cargala en Vercel (Settings → Environment Variables) y en `.env.local` para
desarrollo. **No** lleva el prefijo `NEXT_PUBLIC_`: nunca tiene que llegar
al navegador.
