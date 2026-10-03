/**
 * Turno (Agenda) — ESPECIFICACION.md §6.4. Solo turnos de servicio; un
 * posible cliente que quiere que le vean el auto es un Lead, no un turno.
 *
 * Los turnos que entran por la agenda online (origen "online") quedan
 * "agendado" si todos sus servicios se confirman solos, o "a_confirmar"
 * si alguno se define por WhatsApp (PPF, cerámico, acrílico, sacabollo).
 * "no_vino" queda en la ficha del cliente (respuesta 7.4).
 */
export type EstadoTurno = "agendado" | "a_confirmar" | "ingresado" | "cancelado" | "no_vino";
export type OrigenTurno = "crm" | "online";

export interface ServicioDetalleTurno {
  servicio_id: string;
  nombre: string;
  variante: number | null;
  variante_nombre: string | null;
  cantidad: number;
  precio_texto: string;
}

export interface Turno {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  servicios_previstos: string[];
  fecha: string;
  hora: string;
  hora_hasta: string | null;
  estado: EstadoTurno;
  origen: OrigenTurno;
  fecha_fin_estimada: string | null;
  codigo: string | null;
  puerta_a_puerta: boolean;
  canal: string | null;
  servicios_detalle: ServicioDetalleTurno[];
  precio_estimado: string | null;
  notas: string | null;
  revisado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface TurnoInput {
  cliente_id: string;
  vehiculo_id: string;
  servicios_previstos: string[];
  fecha: string;
  hora: string;
}

export interface TurnoConDatos extends Turno {
  cliente_nombre: string;
  cliente_telefono: string | null;
  vehiculo_descripcion: string;
  /** Con la opción elegida si vino de la agenda online, ej. "Polarizado (Nano carbono)". */
  servicios_nombres: string[];
}

export const ESTADO_TURNO_LABEL: Record<EstadoTurno, string> = {
  agendado: "Agendado",
  a_confirmar: "A confirmar",
  ingresado: "Ingresado",
  cancelado: "Cancelado",
  no_vino: "No vino",
};
