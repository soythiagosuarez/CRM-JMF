/**
 * Disponibilidad de la agenda online. Funciones puras: las usa la página
 * pública (para mostrar qué días y franjas hay) y el servidor (para
 * volver a validar al confirmar, por si alguien reservó en el medio).
 *
 * Reglas (relevamiento de Joaco):
 * - El cliente elige día y horario de ingreso (cada 1 hora dentro de las
 *   franjas del día, como en Calendly); se le dice cuándo estaría listo.
 * - Entran 5 autos a la vez en el taller: un auto ocupa lugar todos los
 *   días entre que entra y que está listo.
 * - Cada servicio puede tener un tope por día y/o por semana (lunes a
 *   domingo), contado por fecha de ingreso.
 * - Los servicios de varios días cuentan días de trabajo: los que tienen
 *   franjas cargadas (lunes a sábado) y no están bloqueados.
 * - Cada servicio tiene su anticipación mínima: los rápidos se reservan
 *   en el día con 2 horas de margen; los que hay que hablar antes (PPF,
 *   cerámico…) desde mañana. Si varios, manda el más exigente. Hasta 60
 *   días adelante (configurable).
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
> &
  Partial<Pick<ServicioPublico, "anticipacion_valor" | "anticipacion_unidad">>;

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
  | { disponible: true; franjas: Franja[]; horarios: string[]; fin: string }
  | { disponible: false; motivo: string };

/** Cada cuánto se ofrece un horario de ingreso dentro de una franja. */
export const INTERVALO_HORARIOS_MIN = 60;

const aMinutos = (hora: string) => {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
};
const aHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/**
 * Horarios en los que se puede dejar el auto: cada hora desde que abre la
 * franja hasta una hora antes de que cierre (9 a 13 → 9, 10, 11 y 12).
 * Con `desdeMinutos` solo quedan los de esa hora en adelante (turnos en
 * el día, respetando la anticipación).
 */
export function horariosDeFranjas(franjas: Franja[], desdeMinutos = 0): string[] {
  const horarios: string[] = [];
  for (const f of franjas) {
    const fin = aMinutos(f.hasta);
    for (let t = aMinutos(f.desde); t + INTERVALO_HORARIOS_MIN <= fin; t += INTERVALO_HORARIOS_MIN) {
      if (t >= desdeMinutos) horarios.push(aHora(t));
    }
  }
  return [...new Set(horarios)].sort();
}

/** Anticipación de un servicio; sin cargar, la general de Config (días). */
function anticipacionDe(
  servicio: ServicioLimites | undefined,
  config: ConfigReservas
): { valor: number; unidad: "horas" | "dias" } {
  if (servicio?.anticipacion_valor != null) {
    return { valor: Math.max(0, servicio.anticipacion_valor), unidad: servicio.anticipacion_unidad === "horas" ? "horas" : "dias" };
  }
  return { valor: Math.max(0, config.anticipacion_min_dias), unidad: "dias" };
}

/**
 * Desde cuándo se puede dejar el auto con estos servicios: fecha y
 * minuto del día. Con varios servicios manda el que pide más
 * anticipación (ej. lavado 2 h + PPF 1 día → desde mañana).
 */
export function inicioMinimo(
  items: ItemReserva[],
  ctx: Pick<ContextoAgenda, "hoy" | "horaActual" | "config" | "servicios">
): { fecha: string; minutos: number } {
  const ahora = ctx.horaActual ? aMinutos(ctx.horaActual) : 0;
  const servicios = items.length > 0 ? items.map((i) => ctx.servicios.find((s) => s.id === i.servicio_id)) : [undefined];
  let inicio = { fecha: ctx.hoy, minutos: ahora };
  for (const servicio of servicios) {
    const { valor, unidad } = anticipacionDe(servicio, ctx.config);
    let candidato: { fecha: string; minutos: number };
    if (unidad === "horas") {
      const total = ahora + valor * 60;
      candidato = { fecha: sumarDias(ctx.hoy, Math.floor(total / 1440)), minutos: total % 1440 };
    } else {
      candidato = valor === 0 ? { fecha: ctx.hoy, minutos: ahora } : { fecha: sumarDias(ctx.hoy, valor), minutos: 0 };
    }
    if (candidato.fecha > inicio.fecha || (candidato.fecha === inicio.fecha && candidato.minutos > inicio.minutos)) {
      inicio = candidato;
    }
  }
  return inicio;
}

export function rangoReservable(ctx: Pick<ContextoAgenda, "hoy" | "config">): {
  desde: string;
  hasta: string;
} {
  // Desde hoy: la anticipación de cada servicio se aplica día por día.
  return {
    desde: ctx.hoy,
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

  const inicio = inicioMinimo(items, ctx);
  if (fecha < inicio.fecha) {
    return { disponible: false, motivo: "Estos servicios se reservan con más anticipación" };
  }
  const desdeMinutos = fecha === inicio.fecha ? inicio.minutos : 0;
  const franjas = franjasDelDia(fecha, ctx.config, ctx.bloqueos).filter(
    (f) => horariosDeFranjas([f], desdeMinutos).length > 0
  );
  const horarios = horariosDeFranjas(franjas, desdeMinutos);
  if (horarios.length === 0) {
    return {
      disponible: false,
      motivo: fecha === inicio.fecha && desdeMinutos > 0 ? "Ya no quedan horarios para hoy" : "El taller no recibe autos ese día",
    };
  }

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

  return { disponible: true, franjas, horarios, fin: dias.at(-1) ?? fecha };
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

/** Validación final al confirmar (servidor): el día y el horario
 * elegidos siguen libres para estos servicios. */
export function validarHorario(
  fecha: string,
  hora: string,
  items: ItemReserva[],
  ctx: ContextoAgenda
): { ok: true; hora: string; fin: string } | { ok: false; error: string } {
  const dia = evaluarDia(fecha, items, ctx);
  if (!dia.disponible) {
    return { ok: false, error: `Ese día ya no está disponible (${dia.motivo.toLowerCase()}). Elegí otro, por favor.` };
  }
  const elegido = hora.slice(0, 5);
  if (!dia.horarios.includes(elegido)) return { ok: false, error: "Ese horario ya no está disponible. Elegí otro, por favor." };
  return { ok: true, hora: elegido, fin: dia.fin };
}
