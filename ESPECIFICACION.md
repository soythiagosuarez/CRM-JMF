# JMF · Centro de Operaciones — Especificación completa (blueprint)

> Documento único de verdad. Fija todo lo decidido para que Claude Code lo construya sin inventar. Última sección: dirección + prompt de arranque para Claude Code.

---

## 1. Qué es y objetivo

Sistema interno único para las tres marcas de JMF (**Detailing**, **Shop**, **Classmotor**). Reemplaza las notas del celular y el Excel. Un solo lugar para:

- Ordenar la operación del taller (turnos, autos, fases de cada servicio).
- Controlar la plata de las tres marcas juntas (saber si el mes está en verde o en rojo, y dónde).
- No perder ningún lead que consulta.
- Fidelizar con recordatorios de mantenimiento y renovación.

**Meta comercial que el sistema debe ayudar a cumplir:** 2–3 PPF por mes y 1 tratamiento cerámico por semana.

---

## 2. Usuarios y acceso

- **Tres personas**: Joaco (dueño), Thiago, equipo.
- **Un solo login compartido** (usuario + contraseña). Sin roles ni permisos separados en el MVP.
- Uso desde **tablet y computadora**, en el taller y en casa. Diseño responsive, pensado primero para pantalla grande.

---

## 3. Stack técnico (para Claude Code)

- **Frontend:** Next.js (App Router) + React. Deploy en **Vercel**.
- **Backend / datos:** **Supabase** (PostgreSQL + Auth). El login compartido se maneja con un único usuario de Supabase Auth.
- **Estilos:** CSS propio con tokens de marca (ver §4) o Tailwind con esos tokens. Componentes reutilizables (Card, KPI, Sidebar, etc.).
- **WhatsApp:** semi-automático, **sin API ni costo**. Cada botón "Avisar" arma un link `https://wa.me/<telefono>?text=<mensaje>` con el mensaje ya personalizado; la persona solo toca enviar.
- **PDF de presupuesto:** generación del lado del cliente/servidor (ej. con una librería de PDF), con la marca puesta.

---

## 4. Sistema de marca (tokens de diseño)

**Colores**

| Token | Hex | Uso |
|---|---|---|
| Negro | `#0E0E0E` / `#131313` | Fondo |
| Panel | `#1B1B1B` / `#1C1C1C` | Tarjetas |
| Rojo F1 | `#E8002D` | Acento principal, activo, alertas de marca, CTA |
| Dorado | `#FFD700` | Momentos premium: metas, podio, totales |
| Blanco | `#F4F4F4` | Texto principal |
| Gris | `#888888` | Texto secundario |
| Verde | `#3ECF7A` | Plata que entra / neto positivo |
| Rojo (semántico) | `#E8002D` | Plata que sale / neto negativo |

**Tipografía**: display robusta tipo Rockwell (aprox. **Roboto Slab** para títulos y números) + una sans limpia (**Inter**) para datos y cuerpo.

**Logos**: el isotipo del auto (en rojo) es el mismo para las tres marcas; solo cambia la palabra debajo (Detailing / Shop / Classmotor). El **Centro de Operaciones** es el paraguas: usa el isotipo rojo + "Centro de Operaciones". Dentro de cada sección de marca, se muestra el logo de esa marca. Fondo oscuro → isotipo rojo + texto blanco.

---

## 5. Mapa del sistema (navegación)

**Operación**
- Inicio (dashboard)
- Agenda (turnos de servicio)
- Autos / Órdenes (tablero de fases)
- Leads / Presupuestos

**Marcas**
- Finanzas (las 3 marcas)
- Shop
- Classmotor

**Gestión**
- Clientes
- Servicios (catálogo con fases)
- Recordatorios
- Reportes

**Config** (abajo del todo)

---

## 6. Modelo de datos

Entidades y cómo se conectan. Los ingresos/egresos automáticos nunca se cargan a mano (ver §7, regla 1).

### 6.1 Cliente
| Campo | Notas |
|---|---|
| id | |
| nombre_completo | |
| telefono | usado para el WhatsApp |
| email | |
| como_llego | cómo llegó a JMF |
| notas | |

Relaciones: 1 cliente → N vehículos, N órdenes, N leads. "Cantidad y qué autos trajo" = derivado de sus vehículos/órdenes.

### 6.2 Vehículo
| Campo | Notas |
|---|---|
| id | |
| cliente_id | |
| marca, modelo, año, patente, color | |
| detalles | observaciones libres |

Relación: 1 vehículo → N órdenes (historial de servicios).

### 6.3 Servicio (catálogo)
| Campo | Notas |
|---|---|
| id | |
| nombre | |
| descripcion / que_incluye | para el presupuesto |
| tiempo_estimado | ver tabla §6.3.1 |
| puerta_a_puerta | sí/no (todos = sí) |
| fases | lista ordenada (ver tabla) |
| precio_referencia | opcional; el precio real se define por orden (depende del auto) |
| mantenimiento_intervalo_meses | para recordatorios (si es tratamiento) |
| renovacion_meses | duración del tratamiento (si aplica) |
| activo | |

#### 6.3.1 Servicios, fases, tiempos (datos reales de JMF)

| Servicio | Fases (en orden) | Tiempo |
|---|---|---|
| PPF | Lavado → Descontaminado → Lavado de motor → Limpieza de interior → Pulido → Aplicación de PPF | 5 días |
| Tratamiento cerámico | Lavado → Descontaminado → Lavado de motor → Limpieza de interior → Pulido → Sellador cerámico | 5 días |
| Tratamiento acrílico | (mismas fases que cerámico) | 5 días |
| Lavado premium | Lavado de carrocería → Lavado de llantas → Limpieza de interior | 5 horas |
| Limpieza de interior full | Desarmado → Limpieza de paneles → Limpieza de periféricos → Armado → Acondicionado | 2 días |
| Limpieza de motor | Pre preparado → Limpieza de motor → Acondicionado | 5 horas |
| Restauración de ópticas | Lijado → Pulido → Sellado | 1 día |
| Sacabollo | Preparación → Desabollado | Depende del bollo |
| Polarizado | Molde de cristales → Limpieza de cristales → Colocación | 1 día |
| Restauración de llantas | Reparación → Pintura | 3 días |

Puerta a puerta: **todos** los servicios.

Renovación / mantenimiento (defaults, editables al cerrar la orden):
- **PPF:** mantenimiento cada 2–3 meses · renovación a los 8 años.
- **Cerámico / acrílico:** mantenimiento cada 1 mes · renovación entre 12 meses y 6 años (según producto → se define al cerrar).
- **Limpieza de interior:** recordatorio a los 6–12 meses (según uso).

### 6.4 Turno (Agenda) — solo turnos de servicio
| Campo | Notas |
|---|---|
| id | |
| cliente_id, vehiculo_id | |
| servicios_previstos | |
| fecha, hora | |
| estado | agendado / ingresado / cancelado |

- Solo trabajos confirmados. El "posible cliente que viene a que le vean el auto" **no** es un turno → va como Lead.
- Sin seña ni anticipo.
- Horarios de atención: **lunes a viernes 9–18, sábados 10–13.**
- Cuando el auto ingresa → se crea/activa la **Orden**.

### 6.5 Orden (Detailing) — nace de un turno
| Campo | Notas |
|---|---|
| id | |
| cliente_id, vehiculo_id, turno_id | |
| servicio_principal_id | maneja el tablero de fases |
| servicios_adicionales[] | { servicio_id, precio } — ítems extra, sin fase propia |
| precio_total, precio_por_servicio | precio **acordado** (aún no es ingreso) |
| fase_actual | referencia a una fase del servicio principal |
| estado | en cola / en proceso / terminado / entregado |
| flags[] | esperando_repuesto/producto, esperando_cliente, demorado (pueden ser varios a la vez) |
| entrega | retira / puerta_a_puerta |
| estado_pago | pendiente / cobrado |
| medio_pago, monto_cobrado, moneda, monto_ars, fecha_cobro | al marcar **cobrado** → genera Movimiento (§6.7) |
| fecha_ingreso, fecha_entrega | |
| notas | |

**Regla clave:** el `precio_acordado` NO es ingreso. El ingreso se registra recién cuando `estado_pago = cobrado`.

### 6.6 Lead / Presupuesto
| Campo | Notas |
|---|---|
| id | |
| cliente_id (nuevo o existente), datos_vehiculo | |
| origen | WhatsApp / vino al taller |
| que_observo | bollo, rayones, suciedad, etc. |
| servicios_consultados[] | |
| presupuesto | { servicios, precios, tiempo_estimado, validez = 7 días } |
| pdf_url | generado con la marca |
| estado | pendiente_presupuesto / presupuestado / aceptado / perdido |

Cuando `estado = aceptado` → se agenda un **Turno de servicio** (link).

### 6.7 Movimiento (Finanzas) — el corazón
| Campo | Notas |
|---|---|
| id | |
| tipo | ingreso / egreso |
| marca | detailing / shop / classmotor / **compartido** |
| categoria | etiqueta (ver §6.7.1) |
| monto, moneda_original | ARS / USD / USDT / cheque |
| monto_ars | **siempre**; usado para todos los totales |
| tipo_cambio | si la moneda no es ARS |
| medio_pago | efectivo_pesos / efectivo_dolares / transferencia / cheque / usdt |
| fecha | |
| origen | manual / orden / classmotor / shop |
| ref_origen | orden_id o auto_classmotor_id → muestra etiqueta "auto · orden #123" |
| descripcion | |

#### 6.7.1 Categorías (etiquetas)

**Egresos**
- **Compartido:** alquiler, luz, agua, servicios, equipo de marketing/comunicación.
- **Detailing:** insumos, productos de trabajo, sueldos.
- **Shop:** compra de mercadería, pauta.
- **Classmotor:** pauta, compra de autos, patentamientos, arreglos, transferencia, productos para reparar.

**Ingresos**
- **Detailing:** servicios (desde órdenes cobradas).
- **Shop:** venta de productos.
- **Classmotor:** ganancia por auto vendido.

### 6.8 Auto Classmotor (ficha)
| Campo | Notas |
|---|---|
| id | |
| tipo | compra_venta / preventa_venta |
| marca, modelo, año, km, patente, color, detalles | |
| precio_base | compra_venta: precio de compra · preventa_venta: precio que quiere el cliente |
| precio_venta | a cuánto lo vendemos |
| costos_extra[] | { concepto, monto }: patentamiento, arreglos, transferencia, pauta, productos_reparacion |
| ganancia | = precio_venta − precio_base − Σ costos_extra (calculado) |
| estado | Ingresa → En preparación estética → Sesión de fotos y contenido → Publicado y pautado → Cliente viene a verlo → Vendido |
| fecha_ingreso, fecha_venta | |

**Reglas financieras de Classmotor:**
- **Preventa/venta:** no se cobra el servicio; la ganancia es la diferencia (`precio_venta − precio_cliente`) menos costos (pauta). Los costos se registran cuando ocurren.
- **Compra-venta:** el dinero de comprar el auto y los costos quedan en la ficha como **capital invertido en autos**, NO como pérdida del mes. Al vender, Classmotor suma su **ganancia** al neto del mes. (Evita el falso "mes en rojo" por comprar una unidad.)
- El trabajo de preparación que hace Detailing sobre un auto de Classmotor **no se factura entre marcas** (se trata simple).

### 6.9 Producto (Shop) — *estructura con datos de ejemplo por ahora*
| Campo | Notas |
|---|---|
| id | |
| nombre | |
| stock_actual | |
| stock_minimo | default **4** → alerta cuando stock_actual ≤ 4 |
| precio_venta | |
| precio_costo | opcional |

- **Botón a MercadoLibre:** un link a la tienda (pendiente de crear la cuenta). Solo abre ML en otra pestaña; **no** lee órdenes (eso requeriría la API, fuera de alcance).
- Vender un producto: descuenta stock y genera un Movimiento de ingreso (origen = shop).
- Los productos y precios se cargan de ejemplo ahora y se editan con la data real desde la misma pantalla.

### 6.10 Recordatorio
| Campo | Notas |
|---|---|
| id | |
| cliente_id, vehiculo_id, orden_id | origen |
| tipo | mantenimiento / renovacion |
| tratamiento | PPF / cerámico / acrílico / interior |
| fecha_proxima | |
| intervalo_meses | para los recurrentes (mantenimiento) |
| estado | pendiente / hecho / descartado |

- Se generan solos al cerrar una orden de tratamiento, con los intervalos por defecto de §6.3.1 (editables).
- Acción: botón "Recontactar" → WhatsApp semi-auto.

---

## 7. Reglas de negocio (todas juntas)

1. **Anti-doble-conteo:** los ingresos que nacen de una orden cobrada, de un auto de Classmotor vendido, o de una venta de Shop, se registran **solos**. El botón "+ Ingreso" a mano es únicamente para plata suelta.
2. **Precio acordado ≠ ingreso:** el ingreso se cuenta recién al marcar la orden **cobrada**.
3. **Moneda única para totales:** todo se convierte a pesos (`monto_ars`) con el tipo de cambio del día; se guarda la moneda original para el registro fiel.
4. **Compartido va aparte:** los gastos compartidos no se reparten entre las marcas; el neto por marca es operativo puro.
5. **Classmotor no ensucia el mes:** la compra de autos es capital invertido, no pérdida; la ganancia entra al vender.
6. **Sin factura interna entre marcas.**
7. **Alertas:** neto mensual (total o por marca) en rojo → alerta en el dashboard. Stock ≤ mínimo → alerta en Shop.
8. **WhatsApp semi-automático:** el botón arma el link con el texto pre-cargado; el envío lo hace la persona.

---

## 8. WhatsApp — plantillas de mensaje

**Tono:** formal y humano, de vos, español rioplatense, sin tecnicismos importados, **sin precios** (el precio se habla en el chat). Variables: `{cliente}`, `{auto}`, `{servicio}`, `{fase}`.

- **Aviso de cambio de fase** (redactamos uno por fase; Joaco aprueba). Ej.: *"Hola {cliente}, te contamos que tu {auto} ya pasó a la etapa de {fase}. Cualquier cosa quedamos a disposición. — JMF Detailing"*
- **Listo — retira:** *"Hola {cliente}, tu {auto} ya está terminado y listo para retirar. Coordinamos cuando quieras pasar. — JMF Detailing"*
- **Listo — puerta a puerta:** *"Hola {cliente}, tu {auto} ya está terminado. Coordinamos el día y horario para llevártelo. — JMF Detailing"*
- **Mantenimiento:** *"Hola {cliente}, se acerca el mantenimiento de tu {servicio}. Cuando quieras coordinamos un turno para dejarlo impecable. — JMF Detailing"*
- **Renovación:** *"Hola {cliente}, ya se cumple el ciclo de tu {servicio}. Si querés, coordinamos para renovarlo y mantener tu {auto} como el primer día. — JMF Detailing"*

*(Textos borrador — se afinan y aprueban antes de cargarlos.)*

---

## 9. Pantallas (qué hace cada una)

1. **Inicio** — resumen: KPIs (autos en taller, ingresos/egresos/neto del mes), Finanzas por marca (con alerta roja), Meta del mes, Autos en el taller con "Avisar", mix de servicios, próximos recordatorios. *(Mockup ya aprobado.)*
2. **Agenda** — calendario de turnos de servicio; alta de turno; al ingresar el auto crea la orden.
3. **Autos / Órdenes** — tablero de fases (el músculo). Cada auto con su fase, flags de estado, cambio de fase en un toque, botón "Avisar", registro de cobro/entrega.
4. **Leads / Presupuestos** — captura de quién consultó, qué auto, qué se observó, estado del lead; armado de presupuesto + PDF.
5. **Finanzas** — lista de movimientos filtrable (marca, categoría, fecha, medio de pago), etiquetas visibles, alta manual de ingreso/egreso, totales por marca + total + compartido.
6. **Shop** — productos, stock, alerta de recompra, precios, botón a ML.
7. **Classmotor** — fichas de auto por estado, con la ganancia calculada; capital invertido en autos.
8. **Clientes** — ficha con datos, vehículos e historial de servicios; búsqueda por nombre/patente.
9. **Servicios** — catálogo editable con fases, tiempos, intervalos de mantenimiento/renovación.
10. **Recordatorios** — mantenimientos y renovaciones próximos, con "Recontactar".
11. **Reportes** — resumen del mes: facturación, marca/servicio más rentable, exportable. (Útil desde el mes 2.)

---

## 10. Alcance y placeholders

- **Shop:** se construye la estructura con productos y precios de ejemplo; la data real se carga después desde la pantalla.
- **MercadoLibre:** solo botón/link (sin integración por API). Link pendiente de crear la cuenta.
- **Presupuesto PDF:** campos y estructura listos; la generación del PDF se construye en esta misma tirada.
- **Reportes y Recordatorios:** quedan construidos, pero muestran datos útiles a partir del mes 2 (necesitan histórico).
- **Entrega a Joaco:** producto **terminado y completo, en una sola entrega** (no por partes).

---

## 11. Dirección para Claude Code

### Orden de construcción (dependencias primero)
1. **Fundaciones:** proyecto Next.js + Supabase + Auth (login compartido), shell con marca (sidebar + topbar), tokens de diseño, navegación.
2. **Servicios** (catálogo con fases) — base de órdenes, agenda y presupuestos.
3. **Clientes + Vehículos.**
4. **Agenda** (turnos de servicio).
5. **Autos / Órdenes** (tablero de fases + WhatsApp + cobro/entrega).
6. **Finanzas** (movimientos + totales por marca + compartido + alertas + regla anti-doble-conteo).
7. **Classmotor** (fichas + ganancia + su impacto en Finanzas).
8. **Shop** (productos + stock + link ML + ingreso por venta).
9. **Leads / Presupuestos** (+ PDF).
10. **Recordatorios** (generación automática al cerrar tratamiento).
11. **Inicio** (dashboard, conectando todo lo anterior).
12. **Reportes.**

### Convenciones
- Todo en español (UI y datos). Formato de plata: pesos con separador de miles (`$3.850.000`).
- Componentes reutilizables; un único sistema de tokens de marca.
- Responsive: pensado para tablet/desktop, usable en pantallas chicas.
- Piso de calidad: foco visible de teclado, estados vacíos con instrucción, sin datos ficticios en producción.

### Prompt de arranque (para pegar en Claude Code)

> Guardá este documento como `ESPECIFICACION.md` dentro del proyecto, y mandá este mensaje como primer prompt en Claude Code.

```
Sos el desarrollador del "Centro de Operaciones" de JMF, un sistema interno para un
negocio con tres marcas (Detailing, Shop, Classmotor).

Leé `ESPECIFICACION.md`: es el plano completo del proyecto y la fuente de verdad.
Seguila al pie y no inventes datos ni features que no estén ahí.

Stack: Next.js (App Router) + React, Supabase (Postgres + Auth), deploy en Vercel.
Login compartido (un solo usuario, sin roles). UI en español, responsive para
tablet/desktop.

Marca: fondo negro (#0E0E0E), tarjetas #1B1B1B, acento rojo F1 #E8002D, dorado #FFD700
para momentos premium, verde #3ECF7A para plata positiva. Display tipo Roboto Slab,
cuerpo Inter.

Empezá SOLO por las FUNDACIONES:
1. Inicializá el proyecto Next.js + conexión a Supabase + Auth con login compartido.
2. Armá el shell: sidebar con la navegación (Operación / Marcas / Gestión) y topbar,
   con los tokens de marca y los componentes base (Card, KPI, Sidebar, Botones).
3. Dejá la pantalla "Inicio" con la estructura del dashboard ya definida (KPIs,
   Finanzas por marca, Meta del mes, Autos en el taller, mix de servicios,
   recordatorios) usando datos de ejemplo por ahora.

Antes de escribir código, decime en 3-4 líneas cómo entendiste el proyecto y qué vas
a hacer primero, para confirmar que estamos alineados.

No avances a otros módulos hasta que apruebe las fundaciones. Cuando termines,
mostrame qué hiciste y esperá mi OK para seguir con "Servicios".
```

---

*Fin de la especificación. Cualquier cambio se hace acá primero y después se baja a Claude Code.*
