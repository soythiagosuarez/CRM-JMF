/**
 * Presupuesto — generador independiente, no se conecta con Clientes ni
 * Agenda. Cuando el cliente acepta, el turno se carga a mano en Agenda.
 */
export type EstadoPresupuesto = "pendiente" | "aceptado" | "rechazado";

export interface ItemPresupuesto {
  nombre: string;
  precio: number;
}

export interface Presupuesto {
  id: string;
  nombre_contacto: string;
  telefono: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_patente: string | null;
  que_observo: string | null;
  servicios: ItemPresupuesto[];
  tiempo_estimado: string | null;
  fecha: string;
  validez: string | null;
  estado: EstadoPresupuesto;
  created_at: string;
  updated_at: string;
}

export interface PresupuestoInput {
  nombre_contacto: string;
  telefono: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_patente: string | null;
  que_observo: string | null;
  servicios: ItemPresupuesto[];
  tiempo_estimado: string | null;
}

export const ESTADO_PRESUPUESTO_LABEL: Record<EstadoPresupuesto, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
};
