/**
 * Lead / Presupuesto — ESPECIFICACION.md §6.6.
 */
export type OrigenLead = "whatsapp" | "vino_al_taller";
export type EstadoLead = "pendiente_presupuesto" | "presupuestado" | "aceptado" | "perdido";

export interface DatosVehiculoLead {
  vehiculo_id: string;
  marca: string | null;
  modelo: string | null;
  patente: string | null;
}

export interface ItemPresupuesto {
  servicio_id: string;
  precio: number;
}

export interface Presupuesto {
  servicios: ItemPresupuesto[];
  tiempo_estimado: string;
  validez: string; // fecha ISO, fecha_presupuesto + 7 días
  fecha: string; // fecha en que se armó
}

export interface Lead {
  id: string;
  cliente_id: string;
  datos_vehiculo: DatosVehiculoLead;
  origen: OrigenLead;
  que_observo: string | null;
  servicios_consultados: string[];
  presupuesto: Presupuesto | null;
  pdf_url: string | null;
  estado: EstadoLead;
  created_at: string;
  updated_at: string;
}

export interface LeadConDatos extends Lead {
  cliente_nombre: string;
  cliente_telefono: string | null;
  servicios_consultados_nombres: string[];
}

export const ESTADO_LEAD_LABEL: Record<EstadoLead, string> = {
  pendiente_presupuesto: "Pendiente de presupuesto",
  presupuestado: "Presupuestado",
  aceptado: "Aceptado",
  perdido: "Perdido",
};

export const ORIGEN_LEAD_LABEL: Record<OrigenLead, string> = {
  whatsapp: "WhatsApp",
  vino_al_taller: "Vino al taller",
};
