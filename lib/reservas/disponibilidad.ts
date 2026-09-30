/**
 * Disponibilidad de la agenda online. Funciones puras: las usa la página
 * pública (para mostrar qué días y franjas hay) y el servidor (para
 * volver a validar al confirmar, por si alguien reservó en el medio).
 *
 * Reglas (relevamiento de Joaco):
 * - El cliente elige día y franja de ingreso; se le dice cuándo estaría listo.
 * - Entran 5 autos a la vez en el taller: un auto ocupa lugar todos los
 *   días entre que entra y que está listo.
 * - Cada servicio puede tener un tope por día y/o por semana (lunes a
 *   domingo), contado por fecha de ingreso.
 * - Los servicios de varios días cuentan días de trabajo: los que tienen
 *   franjas cargadas (lunes a sábado) y no están bloqueados.
 * - Se reserva desde mañana y hasta 60 días adelante (configurable).
 */
import type { ConfigReservas, Franja } from "@/lib/types/config";
import type { Bloqueo, ItemReserva, Ocupacion, ServicioPublico } from "@/lib/types/reserva";
import { diaDeSemana, lunesDeSemana, sumarDias } from "./fechas";

/** Horas de una jornada de taller (9 a 18). */
const HORAS_POR_JORNADA = 9;
/** Tope de seguridad para recorrer días. */
const MAX_DIAS_RECORRIDO = 120;

type ServicioDuracion = Pick<ServicioPublico, "variantes" | "duracion_valor" | "duracion_unidad">;
type ServicioLimites = Pick<
  ServicioPublico,
  "id" | "nombre" | "variantes" | "duracion_valor" | "duracion_unidad" | "limite_dia" | "limite_semana"
>;

/** Duración de un servicio (o de la variante elegida, si tiene la suya). */
function duracion(
  servicio: ServicioDuracion,
  variante: number | null
): { valor: number; unidad: "horas" | "dias" } | null {
  const v = variante != null ? servicio.variantes[variante] : undefined;
  const valor = v?.duracion_valor ?? servicio.duracion_valor;
  const unidad =
    v?.duracion_valor != null ? (v.duracion_unidad ?? "dias") : servicio.duracion_unidad;
  if (!valor || valor <= 0) return null;
  return { valor, unidad: unidad === "horas" ? "horas" : "dias" };
}

/** Jornadas de taller que ocupa un servicio (o la variante elegida). Los
 * servicios de horas ocupan solo el día de ingreso. */
export function jornadasServicio(servicio: ServicioDuracion, variante: number | null): number {
  const d = duracion(servicio, variante);
  if (!d) return 1;
  if (d.unidad === "horas") return Math.max(1, Math.ceil(d.valor / HORAS_POR_JORNADA));
  return Math.ceil(d.valor);
}

/**
 * Varios servicios en el mismo turno: muchas veces mientras se trabaja
 * en uno no se puede trabajar en el otro (Joaco), así que el plazo es la
 * suma de lo que dura cada uno. Los servicios de horas se juntan en
 * jornadas de 9 h: lavado (4 h) + motor (5 h) = 1 día; cerámico (4 días)
 * + ópticas (1 día) = 5 días.
 */
export function jornadasItems(
  items: ItemReserva[],
  servicios: (ServicioDuracion & { id: string })[]
): number {
  let dias = 0;
  let horas = 0;
  for (const item of items) {
    const servicio = servicios.find((s) => s.id === item.servicio_id);
    if (!servicio) continue;
    const d = duracion(servicio, item.variante);
    if (!d) dias += 1;
    else if (d.unidad === "horas") horas += d.valor;
    else dias += Math.ceil(d.valor);
  }
  return Math.max(1, dias + Math.ceil(horas / HORAS_POR_JORNADA));
}

function bloqueosDelDia(fecha: string, bloqueos: Bloqueo[]): Bloqueo[] {
  return bloqueos.filter((b) => b.fecha === fecha);
}

/** Un día es de trabajo si tiene franjas cargadas y no está bloqueado entero. */
export function esDiaDeTrabajo(fecha: string, config: ConfigReservas, bloqueos: Bloqueo[]): boolean {
  const franjas = config.franjas[diaDeSemana(fecha)] ?? [];
  if (franjas.length === 0) return false;
  return !bloqueosDelDia(fecha, bloqueos).some((b) => !b.franja_desde);
}

/** Franjas en las que se puede dejar el auto ese día (sin las bloqueadas). */
export function franjasDelDia(fecha: string, config: ConfigReservas, bloqueos: Bloqueo[]): Franja[] {
  if (!esDiaDeTrabajo(fecha, config, bloqueos)) return [];
  const bloqueadas = new Set(
    bloqueosDelDia(fecha, bloqueos)
      .map((b) => b.franja_desde?.slice(0, 5))
      .filter(Boolean)
  );
  return (config.franjas[diaDeSemana(fecha)] ?? []).filter((f) => !bloqueadas.has(f.desde.slice(0, 5)));
}

/** Días que el auto ocupa lugar: arranca el día de ingreso y suma
 * jornadas en días de trabajo (salteando domingos y días bloqueados). */
export function diasOcupados(
  inicio: string,
  jornadas: number,
  config: ConfigReservas,
  bloqueos: Bloqueo[]
): string[] {
  const dias: string[] = [];
  let fecha = inicio;
  for (let i = 0; dias.length < jornadas && i < MAX_DIAS_RECORRIDO; i++) {
    if (fecha === inicio || esDiaDeTrabajo(fecha, config, bloqueos)) dias.push(fecha);
    fecha = sumarDias(fecha, 1);
  }
  return dias;
}

/** Último día que el auto ocupa el taller (= cuándo estaría listo). */
export function fechaFinEstimada(
  inicio: string,
  jornadas: number,
  config: ConfigReservas,
  bloqueos: Bloqueo[]
): string {
  return diasOcupados(inicio, jornadas, config, bloqueos).at(-1) ?? inicio;
}

export interface IndiceOcupacion {
  /** autos en el taller por día */
  taller: Map<string, number>;
  /** servicio_id → (fecha de ingreso → cantidad) */
  porServicio: Map<string, Map<string, number>>;
}

export function indexarOcupaciones(ocupaciones: Ocupacion[]): IndiceOcupacion {
  const taller = new Map<string, number>();
  const porServicio = new Map<string, Map<string, number>>();

  for (const o of ocupaciones) {
    if (o.ocupaTaller) {
      let fecha = o.inicio;
      for (let i = 0; fecha <= o.fin && i < MAX_DIAS_RECORRIDO; i++) {
        taller.set(fecha, (taller.get(fecha) ?? 0) + 1);
        fecha = sumarDias(fecha, 1);
      }
    }
    for (const servicioId of o.servicios) {
      if (!porServicio.has(servicioId)) porServicio.set(servicioId, new Map());
      const mapa = porServicio.get(servicioId)!;
      mapa.set(o.inicio, (mapa.get(o.inicio) ?? 0) + 1);
    }
  }

  return { taller, porServicio };
}

function contarDia(mapa: Map<string, number> | undefined, fecha: string): number {
  return mapa?.get(fecha) ?? 0;
}

function contarSemana(mapa: Map<string, number> | undefined, fecha: string): number {
  if (!mapa) return 0;
  const lunes = lunesDeSemana(fecha);
  let total = 0;
  for (let i = 0; i < 7; i++) total += mapa.get(sumarDias(lunes, i)) ?? 0;
  return total;
}

export interface ContextoAgenda {
  hoy: string;
  /** "HH:MM" en Argentina; solo importa si se permite reservar para hoy. */
  horaActual?: string;
  config: ConfigReservas;
  servicios: ServicioLimites[];
  ocupaciones: Ocupacion[];
  bloqueos: Bloqueo[];
}

export type ResultadoDia =
  | { disponible: true; franjas: Franja[]; fin: string }
  | { disponible: false; motivo: string };

export function rangoReservable(ctx: Pick<ContextoAgenda, "hoy" | "config">): {
  desde: string;
  hasta: string;
} {
  return {
    desde: sumarDias(ctx.hoy, Math.max(0, ctx.config.anticipacion_min_dias)),
    hasta: sumarDias(ctx.hoy, Math.max(0, ctx.config.anticipacion_max_dias)),
  };
}

/** ¿Se puede ingresar un auto con estos servicios en `fecha`? */
export function evaluarDia(
  fecha: string,
  items: ItemReserva[],
  ctx: ContextoAgenda,
  indice: IndiceOcupacion = indexarOcupaciones(ctx.ocupaciones)
): ResultadoDia {
  const { desde, hasta } = rangoReservable(ctx);
  if (fecha < desde || fecha > hasta) {
    return { disponible: false, motivo: "Fuera del rango de reservas" };
  }

  let franjas = franjasDelDia(fecha, ctx.config, ctx.bloqueos);
  if (fecha === ctx.hoy && ctx.horaActual) {
    franjas = franjas.filter((f) => f.hasta.slice(0, 5) > ctx.horaActual!);
  }
  if (franjas.length === 0) return { disponible: false, motivo: "El taller no recibe autos ese día" };

  for (const item of items) {
    const servicio = ctx.servicios.find((s) => s.id === item.servicio_id);
    if (!servicio) return { disponible: false, motivo: "Servicio no disponible" };
    const mapa = indice.porServicio.get(servicio.id);
    if (servicio.limite_dia != null && contarDia(mapa, fecha) + 1 > servicio.limite_dia) {
      return { disponible: false, motivo: `No quedan lugares para ${servicio.nombre} ese día` };
    }
    if (servicio.limite_semana != null && contarSemana(mapa, fecha) + 1 > servicio.limite_semana) {
      return { disponible: false, motivo: `No quedan lugares para ${servicio.nombre} esa semana` };
    }
  }

  const dias = diasOcupados(fecha, jornadasItems(items, ctx.servicios), ctx.config, ctx.bloqueos);
  for (const dia of dias) {
    if ((indice.taller.get(dia) ?? 0) + 1 > ctx.config.capacidad_taller) {
      return { disponible: false, motivo: "El taller está completo esos días" };
    }
  }

  return { disponible: true, franjas, fin: dias.at(-1) ?? fecha };
}

/** Disponibilidad de todo el rango reservable, día por día. */
export function calcularDisponibilidad(
  items: ItemReserva[],
  ctx: ContextoAgenda
): Map<string, ResultadoDia> {
  const indice = indexarOcupaciones(ctx.ocupaciones);
  const { desde, hasta } = rangoReservable(ctx);
  const resultado = new Map<string, ResultadoDia>();
  let fecha = desde;
  for (let i = 0; fecha <= hasta && i < 400; i++) {
    resultado.set(fecha, evaluarDia(fecha, items, ctx, indice));
    fecha = sumarDias(fecha, 1);
  }
  return resultado;
}

/** Validación final al confirmar (servidor). */
export function validarFranja(
  fecha: string,
  franjaDesde: string,
  items: ItemReserva[],
  ctx: ContextoAgenda
): { ok: true; franja: Franja; fin: string } | { ok: false; error: string } {
  const dia = evaluarDia(fecha, items, ctx);
  if (!dia.disponible) {
    return { ok: false, error: `Ese día ya no está disponible (${dia.motivo.toLowerCase()}). Elegí otro, por favor.` };
  }
  const franja = dia.franjas.find((f) => f.desde.slice(0, 5) === franjaDesde.slice(0, 5));
  if (!franja) return { ok: false, error: "Esa franja ya no está disponible. Elegí otra, por favor." };
  return { ok: true, franja, fin: dia.fin };
}
