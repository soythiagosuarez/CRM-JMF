/**
 * Cliente y Vehículo — ESPECIFICACION.md §6.1 y §6.2.
 */
import type { CondicionVehiculo, TamanoVehiculo } from "./reserva";

export type OrigenCliente = "detailing" | "classmotor";

export interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  como_llego: string | null;
  notas: string | null;
  origen: OrigenCliente | null;
  /** Aceptó recibir promociones por WhatsApp (casilla de la agenda online). */
  acepta_promos: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteInput {
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  como_llego: string | null;
  notas: string | null;
}

export interface Vehiculo {
  id: string;
  cliente_id: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  patente: string | null;
  color: string | null;
  detalles: string | null;
  tamano: TamanoVehiculo | null;
  condicion: CondicionVehiculo | null;
  created_at: string;
  updated_at: string;
}

export interface VehiculoInput {
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  patente: string | null;
  color: string | null;
  detalles: string | null;
  tamano: TamanoVehiculo | null;
  condicion: CondicionVehiculo | null;
}

export interface ClienteConVehiculos extends Cliente {
  vehiculos: Vehiculo[];
}
