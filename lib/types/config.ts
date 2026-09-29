/**
 * Configuración editable del negocio — antes hardcodeada, ahora vive en
 * la tabla "configuracion" (fila única "global").
 */
import type { MarcaMovimiento, TipoMovimiento } from "./movimiento";

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export const DIAS_SEMANA: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DIA_LABEL: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export interface HorarioDia {
  cerrado: boolean;
  desde: string; // "HH:MM"
  hasta: string; // "HH:MM"
}

export type Horarios = Record<DiaSemana, HorarioDia>;

export type CategoriasMovimiento = Record<TipoMovimiento, Record<MarcaMovimiento, string[]>>;

/** Franja de ingreso de autos para la agenda online (ej. 09:00–13:00). */
export interface Franja {
  desde: string; // "HH:MM"
  hasta: string; // "HH:MM"
}

export type FranjasPorDia = Record<DiaSemana, Franja[]>;

/** Ajustes de la agenda online (/reservar), editables en Config. */
export interface ConfigReservas {
  /** Número de WhatsApp de JMF en formato internacional, solo dígitos. */
  whatsapp: string;
  direccion: string;
  /** Lo que el cliente tiene que saber antes de venir (pantalla final). */
  indicaciones: string[];
  franjas: FranjasPorDia;
  /** Autos que entran en el taller al mismo tiempo. */
  capacidad_taller: number;
  anticipacion_min_dias: number;
  anticipacion_max_dias: number;
  /** Anti-spam: reservas pendientes que puede tener un mismo celular. */
  max_pendientes_por_celular: number;
}

/** Motivos de puntos que se cargan a mano desde la ficha del cliente. */
export type MotivoPuntos =
  | "recomendacion"
  | "resena_google"
  | "cumpleanos"
  | "shop"
  | "classmotor"
  | "reserva_online"
  | "ajuste";

export const MOTIVO_PUNTOS_LABEL: Record<MotivoPuntos, string> = {
  recomendacion: "Recomendó a alguien que vino",
  resena_google: "Dejó reseña en Google",
  cumpleanos: "Cumpleaños",
  shop: "Compra en Shop",
  classmotor: "Compró o vendió un auto con Classmotor",
  reserva_online: "Reservó por la agenda online",
  ajuste: "Ajuste o corrección",
};

export interface ConfigFidelizacion {
  /** 1 punto cada tantos pesos cobrados en servicios básicos. */
  pesos_por_punto: number;
  /** Días sin respuesta para volver a avisar al cliente. */
  reaviso_dias: number;
  /** Puntos sugeridos por motivo al cargar a mano (vacío = se escribe). */
  puntos_por_motivo: Partial<Record<MotivoPuntos, number>>;
}

export interface Configuracion {
  id: string;
  horarios: Horarios;
  categorias_movimiento: CategoriasMovimiento;
  reservas: ConfigReservas;
  fidelizacion: ConfigFidelizacion;
  updated_at: string;
}

/** getDay() de JS: 0=domingo ... 6=sábado. */
export const DIA_SEMANA_POR_INDICE: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const DIA_CORTO: Record<DiaSemana, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

/** Resumen legible de los horarios, agrupando días consecutivos con el
 * mismo rango: "Lun a vie 09:00–18:00 · Sáb 10:00–13:00". */
export function resumenHorarios(horarios: Horarios): string {
  const grupos: { desde: string; primero: DiaSemana; ultimo: DiaSemana; hasta: string }[] = [];

  for (const dia of DIAS_SEMANA) {
    const h = horarios[dia];
    if (h.cerrado) continue;
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.desde === h.desde && ultimo.hasta === h.hasta) {
      ultimo.ultimo = dia;
    } else {
      grupos.push({ desde: h.desde, hasta: h.hasta, primero: dia, ultimo: dia });
    }
  }

  if (grupos.length === 0) return "Cerrado todos los días";

  return grupos
    .map((g) => {
      const rango =
        g.primero === g.ultimo
          ? DIA_CORTO[g.primero]
          : `${DIA_CORTO[g.primero]} a ${DIA_CORTO[g.ultimo].toLowerCase()}`;
      return `${rango} ${g.desde}–${g.hasta}`;
    })
    .join(" · ");
}
