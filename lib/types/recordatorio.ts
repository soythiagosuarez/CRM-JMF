/**
 * Recordatorio — ESPECIFICACION.md §6.10. Se generan solos al cerrar
 * (entregar) una orden de tratamiento, con los intervalos por defecto
 * del servicio (editables).
 */
/** "nota" = recordatorio libre cargado a mano, sin cliente/vehículo/orden
 * (ej. grabar contenido, pagar factura de luz, hablarle a un proveedor). */
export type TipoRecordatorio = "mantenimiento" | "renovacion" | "nota";
export type EstadoRecordatorio = "pendiente" | "hecho" | "descartado";

export interface Recordatorio {
  id: string;
  cliente_id: string | null;
  vehiculo_id: string | null;
  orden_id: string | null;
  tipo: TipoRecordatorio;
  titulo: string | null;
  tratamiento: string | null;
  fecha_proxima: string | null;
  intervalo_meses: number | null;
  estado: EstadoRecordatorio;
  created_at: string;
  updated_at: string;
}

export interface RecordatorioConDatos extends Recordatorio {
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  vehiculo_descripcion: string | null;
}

export const TIPO_LABEL: Record<TipoRecordatorio, string> = {
  mantenimiento: "Mantenimiento",
  renovacion: "Renovación",
  nota: "Nota",
};

export const ESTADO_LABEL: Record<EstadoRecordatorio, string> = {
  pendiente: "Pendiente",
  hecho: "Hecho",
  descartado: "Descartado",
};
