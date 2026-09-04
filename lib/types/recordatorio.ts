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
 * servidor: no hay envío push real — el aviso es una alerta DENTRO del
 * CRM (banner en Inicio) que se recalcula cada vez que alguien entra. */
export type FrecuenciaTipo = "diario" | "cada_x_dias" | "cada_x_horas_o_minutos";
export type FrecuenciaUnidad = "minutos" | "horas";
/** @deprecated Ya no se usa — el aviso es una alerta interna, no un envío
 * por WhatsApp/SMS/Gmail (esos requerían pagar una API). Se deja el tipo
 * por compatibilidad con filas viejas. */
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
  ultimo_recordado_en: string | null;
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

/**
 * ¿Corresponde mostrar este recordatorio como alerta arriba de Inicio
 * ahora mismo? Solo para "nota" pendientes. Si tiene fecha exacta, no
 * alerta antes de esa fecha. Si tiene frecuencia, vuelve a alertar cada
 * tanto tiempo desde el último cierre; si no tiene frecuencia, alerta
 * una sola vez (hasta que Joaco la cierre).
 */
export function debeAlertar(r: Recordatorio, ahora: Date = new Date()): boolean {
  if (r.tipo !== "nota" || r.estado !== "pendiente") return false;

  if (r.fecha_proxima) {
    const hoyISO = ahora.toISOString().slice(0, 10);
    if (hoyISO < r.fecha_proxima) return false;
  }

  if (!r.frecuencia_tipo) {
    return !r.ultimo_recordado_en;
  }

  const base = new Date(r.ultimo_recordado_en ?? r.created_at);
  const proxima = new Date(base);
  if (r.frecuencia_tipo === "diario") {
    proxima.setDate(proxima.getDate() + 1);
  } else if (r.frecuencia_tipo === "cada_x_dias") {
    proxima.setDate(proxima.getDate() + (r.frecuencia_intervalo ?? 1));
  } else {
    const minutos = r.frecuencia_unidad === "horas" ? (r.frecuencia_intervalo ?? 1) * 60 : (r.frecuencia_intervalo ?? 1);
    proxima.setMinutes(proxima.getMinutes() + minutos);
  }

  return ahora >= proxima;
}
