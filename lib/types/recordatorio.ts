/**
 * Recordatorio — ESPECIFICACION.md §6.10. Se generan solos al cerrar
 * (entregar) una orden de tratamiento, con los intervalos por defecto
 * del servicio (editables).
 */
/** "nota" = recordatorio libre cargado a mano, sin cliente/vehículo/orden
 * (ej. grabar contenido, pagar factura de luz, hablarle a un proveedor). */
export type TipoRecordatorio = "mantenimiento" | "renovacion" | "nota";
export type EstadoRecordatorio = "pendiente" | "hecho" | "descartado";

/** Repetición de un recordatorio "nota" (§ feedback: recordatorios libres
 * que se repiten, ej. "grabar contenido" cada 3 días). Sin cron en el
 * servidor: la plataforma no "empuja" nada sola, muestra el pendiente y
 * el botón de envío cada vez que alguien entra a Recordatorios/Inicio. */
export type FrecuenciaTipo = "diario" | "cada_x_dias" | "cada_x_horas_o_minutos";
export type FrecuenciaUnidad = "minutos" | "horas";
/** Medio semi-automático: la plataforma arma el link con el texto listo,
 * el usuario lo clickea y elige a quién mandárselo (no hay envío
 * automático real — mismo criterio que WhatsApp en el resto de la app). */
export type MedioRecordatorio = "whatsapp" | "sms" | "gmail";

export interface Recordatorio {
  id: string;
  cliente_id: string | null;
  vehiculo_id: string | null;
  orden_id: string | null;
  tipo: TipoRecordatorio;
  titulo: string | null;
  tratamiento: string | null;
  fecha_proxima: string | null;
  hora_proxima: string | null;
  intervalo_meses: number | null;
  frecuencia_tipo: FrecuenciaTipo | null;
  frecuencia_intervalo: number | null;
  frecuencia_unidad: FrecuenciaUnidad | null;
  medio: MedioRecordatorio | null;
  auto_completar: boolean;
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

export const MEDIO_LABEL: Record<MedioRecordatorio, string> = {
  whatsapp: "WhatsApp",
  sms: "Mensaje de texto",
  gmail: "Gmail",
};

export function resumenFrecuencia(
  tipo: FrecuenciaTipo | null,
  intervalo: number | null,
  unidad: FrecuenciaUnidad | null
): string | null {
  if (!tipo) return null;
  if (tipo === "diario") return "Todos los días";
  if (tipo === "cada_x_dias") return `Cada ${intervalo ?? 1} día${(intervalo ?? 1) === 1 ? "" : "s"}`;
  return `Cada ${intervalo ?? 1} ${unidad === "horas" ? "hora" : "minuto"}${(intervalo ?? 1) === 1 ? "" : "s"}`;
}
