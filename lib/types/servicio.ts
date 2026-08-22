/**
 * Servicio (catálogo) — ESPECIFICACION.md §6.3.
 */
export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  tiempo_estimado: string | null;
  puerta_a_puerta: boolean;
  /** Lista ordenada de nombres de fase, ej. ["Lavado", "Descontaminado", ...] */
  fases: string[];
  precio_referencia: number | null;
  mantenimiento_intervalo_meses: number | null;
  renovacion_meses: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicioInput {
  nombre: string;
  descripcion: string | null;
  tiempo_estimado: string | null;
  puerta_a_puerta: boolean;
  fases: string[];
  precio_referencia: number | null;
  mantenimiento_intervalo_meses: number | null;
  renovacion_meses: number | null;
}
