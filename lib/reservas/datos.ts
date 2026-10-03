import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarConfigReservas } from "./config";
import { fechaFinEstimada, jornadasItems, type ContextoAgenda } from "./disponibilidad";
import { horaArgentina, hoyArgentina, sumarDias } from "./fechas";
import type { ConfigReservas } from "@/lib/types/config";
import type { Bloqueo, ItemReserva, Ocupacion, ServicioPublico } from "@/lib/types/reserva";
import type { Servicio } from "@/lib/types/servicio";
import { normalizarVariantes } from "./catalogo";

/** Cuántos días para atrás se miran turnos/bloqueos: alcanza para cubrir
 * la semana en curso y un servicio largo que arrancó antes de hoy. */
const DIAS_HACIA_ATRAS = 21;

const CAMPOS_SERVICIO_PUBLICO =
  "id, nombre, descripcion, reserva_online, moneda, variantes, precio_referencia, precio_hasta, duracion_valor, duracion_unidad, limite_dia, limite_semana, activo";

function aServicioPublico(fila: Record<string, unknown>): ServicioPublico {
  const s = fila as unknown as Servicio;
  return {
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion,
    reserva_online: s.reserva_online ?? "no",
    moneda: s.moneda === "USD" ? "USD" : "ARS",
    variantes: normalizarVariantes(s.variantes),
    precio_referencia: s.precio_referencia != null ? Number(s.precio_referencia) : null,
    precio_hasta: s.precio_hasta != null ? Number(s.precio_hasta) : null,
    duracion_valor: s.duracion_valor,
    duracion_unidad: s.duracion_unidad,
    limite_dia: s.limite_dia,
    limite_semana: s.limite_semana,
  };
}

interface TurnoOcupacion {
  id: string;
  fecha: string;
  fecha_fin_estimada: string | null;
  servicios_previstos: string[];
  servicios_detalle: { servicio_id?: string; variante?: number | null; cantidad?: number }[] | null;
  estado: string;
}

/** Los servicios de un turno como ítems (con la variante si la eligió). */
export function itemsDeTurno(t: Pick<TurnoOcupacion, "servicios_previstos" | "servicios_detalle">): ItemReserva[] {
  const detalle = Array.isArray(t.servicios_detalle) ? t.servicios_detalle : [];
  return t.servicios_previstos.map((servicio_id) => {
    const d = detalle.find((x) => x.servicio_id === servicio_id);
    return {
      servicio_id,
      variante: typeof d?.variante === "number" ? d.variante : null,
      cantidad: typeof d?.cantidad === "number" ? d.cantidad : 1,
    };
  });
}

async function cargarBloqueos(supabase: SupabaseClient, hoy: string): Promise<Bloqueo[]> {
  const { data, error } = await supabase
    .from("agenda_bloqueos")
    .select("id, fecha, franja_desde, motivo")
    .gte("fecha", sumarDias(hoy, -DIAS_HACIA_ATRAS))
    .order("fecha", { ascending: true });
  if (error) throw new Error("No se pudieron cargar los días bloqueados: " + error.message);
  return (data ?? []).map((b) => ({
    id: b.id as string,
    fecha: b.fecha as string,
    franja_desde: b.franja_desde ? String(b.franja_desde).slice(0, 5) : null,
    motivo: (b.motivo as string | null) ?? null,
  }));
}

/**
 * Autos que ya tienen lugar tomado, sin datos personales:
 * - turnos agendados / a confirmar: ocupan el taller desde la fecha hasta
 *   el fin estimado, y cuentan para los límites de sus servicios;
 * - turnos ingresados: solo cuentan para los límites (el lugar en el
 *   taller lo marca su orden);
 * - órdenes no entregadas: ocupan el taller desde que entraron hasta el
 *   fin estimado (o hasta hoy, si se demoró).
 */
async function cargarOcupaciones(
  supabase: SupabaseClient,
  hoy: string,
  servicios: ServicioPublico[],
  config: ConfigReservas,
  bloqueos: Bloqueo[]
): Promise<Ocupacion[]> {
  const [{ data: turnos, error: errorTurnos }, { data: ordenes, error: errorOrdenes }] = await Promise.all([
    supabase
      .from("turnos")
      .select("id, fecha, fecha_fin_estimada, servicios_previstos, servicios_detalle, estado")
      .gte("fecha", sumarDias(hoy, -DIAS_HACIA_ATRAS))
      .in("estado", ["agendado", "a_confirmar", "ingresado"]),
    supabase
      .from("ordenes")
      .select("fecha_ingreso, turno_id, servicio_principal_id")
      .neq("estado", "entregado"),
  ]);
  if (errorTurnos) throw new Error("No se pudieron cargar los turnos: " + errorTurnos.message);
  if (errorOrdenes) throw new Error("No se pudieron cargar las órdenes: " + errorOrdenes.message);

  const finPorTurno = new Map<string, string>();
  const ocupaciones: Ocupacion[] = [];

  for (const t of (turnos ?? []) as TurnoOcupacion[]) {
    const fin =
      t.fecha_fin_estimada ??
      fechaFinEstimada(t.fecha, jornadasItems(itemsDeTurno(t), servicios), config, bloqueos);
    finPorTurno.set(t.id, fin);
    ocupaciones.push({
      inicio: t.fecha,
      fin,
      ocupaTaller: t.estado !== "ingresado" && fin >= hoy,
      servicios: t.servicios_previstos,
    });
  }

  for (const o of ordenes ?? []) {
    const inicio = (o.fecha_ingreso as string | null) ?? hoy;
    const estimado =
      (o.turno_id && finPorTurno.get(o.turno_id as string)) ||
      fechaFinEstimada(
        inicio,
        jornadasItems([{ servicio_id: o.servicio_principal_id as string, variante: null, cantidad: 1 }], servicios),
        config,
        bloqueos
      );
    ocupaciones.push({ inicio, fin: estimado > hoy ? estimado : hoy, ocupaTaller: true, servicios: [] });
  }

  return ocupaciones;
}

/**
 * Todo lo necesario para calcular disponibilidad. `servicios` trae
 * todos los activos (para duraciones de turnos cargados a mano);
 * `reservables` solo los que se ofrecen en la agenda online.
 */
export async function obtenerContextoAgenda(
  supabase: SupabaseClient
): Promise<ContextoAgenda & { reservables: ServicioPublico[] }> {
  const hoy = hoyArgentina();

  const [{ data: config, error: errorConfig }, { data: servicios, error: errorServicios }, bloqueos] =
    await Promise.all([
      supabase.from("configuracion").select("reservas").eq("id", "global").single(),
      supabase.from("servicios").select(CAMPOS_SERVICIO_PUBLICO).order("nombre", { ascending: true }),
      cargarBloqueos(supabase, hoy),
    ]);
  if (errorConfig) throw new Error("No se pudo cargar la configuración: " + errorConfig.message);
  if (errorServicios) throw new Error("No se pudieron cargar los servicios: " + errorServicios.message);

  const configReservas = normalizarConfigReservas(config?.reservas);
  const todos = (servicios ?? []).map(aServicioPublico);
  const reservables = (servicios ?? [])
    .filter((s) => s.activo && s.reserva_online !== "no")
    .map(aServicioPublico);

  const ocupaciones = await cargarOcupaciones(supabase, hoy, todos, configReservas, bloqueos);

  return {
    hoy,
    horaActual: horaArgentina(),
    config: configReservas,
    servicios: todos,
    reservables,
    ocupaciones,
    bloqueos,
  };
}

/** Fecha estimada de fin para un turno cargado desde el CRM. */
export async function calcularFinTurno(
  supabase: SupabaseClient,
  fecha: string,
  items: ItemReserva[]
): Promise<string> {
  const hoy = hoyArgentina();
  const [{ data: config }, { data: servicios }, bloqueos] = await Promise.all([
    supabase.from("configuracion").select("reservas").eq("id", "global").single(),
    supabase.from("servicios").select(CAMPOS_SERVICIO_PUBLICO),
    cargarBloqueos(supabase, hoy),
  ]);
  const configReservas = normalizarConfigReservas(config?.reservas);
  return fechaFinEstimada(
    fecha,
    jornadasItems(items, (servicios ?? []).map(aServicioPublico)),
    configReservas,
    bloqueos
  );
}
