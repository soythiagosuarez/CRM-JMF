/**
 * Turno (Agenda) — ESPECIFICACION.md §6.4. Solo turnos de servicio
 * confirmados; un posible cliente que quiere que le vean el auto es un
 * Lead, no un turno (§6.4).
 */
export type EstadoTurno = "agendado" | "ingresado" | "cancelado";

export interface Turno {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  servicios_previstos: string[];
  fecha: string;
  hora: string;
  estado: EstadoTurno;
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
  vehiculo_descripcion: string;
  servicios_nombres: string[];
}
