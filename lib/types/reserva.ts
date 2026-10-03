/**
 * Agenda online (/reservar): lo que viaja entre la página pública, el
 * servidor y el CRM.
 */
import type { ConfigReservas } from "./config";
import type { Servicio } from "./servicio";

/** Lo que la página pública necesita saber de cada servicio. */
export type ServicioPublico = Pick<
  Servicio,
  | "id"
  | "nombre"
  | "descripcion"
  | "reserva_online"
  | "moneda"
  | "variantes"
  | "precio_referencia"
  | "precio_hasta"
  | "duracion_valor"
  | "duracion_unidad"
  | "limite_dia"
  | "limite_semana"
>;

/** Un servicio elegido en la reserva. `variante` es el índice dentro de
 * servicio.variantes (null si el servicio no tiene variantes). */
export interface ItemReserva {
  servicio_id: string;
  variante: number | null;
  cantidad: number;
}

/**
 * Un auto que ya tiene lugar tomado: sin datos personales, solo fechas y
 * servicios. `ocupaTaller` = cuenta para la capacidad del taller en cada
 * día entre inicio y fin; `servicios` = cuenta para los límites por día y
 * por semana de cada servicio, en la fecha de inicio.
 */
export interface Ocupacion {
  inicio: string;
  fin: string;
  ocupaTaller: boolean;
  servicios: string[];
}

export interface Bloqueo {
  id?: string;
  fecha: string;
  /** null = todo el día; si no, el inicio ("HH:MM") de la franja bloqueada. */
  franja_desde: string | null;
  motivo?: string | null;
}

/** Todo lo que la página pública necesita para calcular disponibilidad. */
export interface DatosAgendaPublica {
  hoy: string;
  config: ConfigReservas;
  servicios: ServicioPublico[];
  ocupaciones: Ocupacion[];
  bloqueos: Bloqueo[];
}

export type CanalReserva =
  | "instagram"
  | "whatsapp"
  | "google"
  | "web"
  | "qr"
  | "recomendacion"
  | "otro";

export const CANAL_LABEL: Record<CanalReserva, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google: "Google o Google Maps",
  web: "La web de JMF",
  qr: "Cartel o QR en el taller",
  recomendacion: "Me lo recomendaron",
  otro: "Otro",
};

export type TamanoVehiculo = "chico" | "mediano" | "suv" | "pickup" | "grande";
export type CondicionVehiculo = "0km" | "usado";

export interface VehiculoReservaNuevo {
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  color: string;
  tamano: TamanoVehiculo;
  condicion: CondicionVehiculo;
}

export interface ReservaInput {
  /** "actual" = dijo que ya vino a JMF y lo encontramos por celular. */
  modo: "nuevo" | "actual";
  telefono: string;
  nombre: string;
  email: string;
  /** id de un auto suyo ya cargado, o null si carga uno nuevo. */
  vehiculo_id: string | null;
  vehiculo: VehiculoReservaNuevo | null;
  items: ItemReserva[];
  fecha: string;
  franja_desde: string;
  puerta_a_puerta: boolean;
  canal: CanalReserva;
  acepta_promos: boolean;
}

export interface ReservaConfirmada {
  codigo: string;
  estado: "agendado" | "a_confirmar";
  cliente: string;
  auto: string;
  patente: string;
  servicios: string;
  fecha: string;
  franja_desde: string;
  franja_hasta: string;
  fecha_listo: string;
  precio: string;
  puerta_a_puerta: boolean;
}

export interface VehiculoEnmascarado {
  id: string;
  descripcion: string;
  patente: string;
}

/** Resultado del chequeo que muestra Config sobre la agenda online. */
export type EstadoAgendaOnline = { ok: true; servicios: number } | { ok: false; problema: string };

export type { ConfigReservas };
