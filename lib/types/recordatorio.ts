/**
 * Recordatorio — ESPECIFICACION.md §6.10. Se generan solos al cerrar
 * (entregar) una orden de tratamiento, con los intervalos por defecto
 * del servicio (editables).
 */
export type TipoRecordatorio = "mantenimiento" | "renovacion";
export type EstadoRecordatorio = "pendiente" | "hecho" | "descartado";

export interface Recordatorio {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  orden_id: string | null;
  tipo: TipoRecordatorio;
  tratamiento: string | null;
  fecha_proxima: string | null;
  intervalo_meses: number | null;
  estado: EstadoRecordatorio;
  created_at: string;
  updated_at: string;
}

export interface RecordatorioConDatos extends Recordatorio {
  cliente_nombre: string;
  cliente_telefono: string | null;
  vehiculo_descripcion: string;
}

export const TIPO_LABEL: Record<TipoRecordatorio, string> = {
  mantenimiento: "Mantenimiento",
  renovacion: "Renovación",
};

export const ESTADO_LABEL: Record<EstadoRecordatorio, string> = {
  pendiente: "Pendiente",
  hecho: "Hecho",
  descartado: "Descartado",
};
