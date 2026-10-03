/**
 * Servicio (catálogo) — ESPECIFICACION.md §6.3, más lo que necesita la
 * agenda online: precios (con variantes), duración, límites por día o
 * semana y si suma puntos de fidelización.
 */

/** si = se reserva directo · consulta = se reserva pero queda "a
 * confirmar" hasta hablarlo por WhatsApp · no = no aparece en la agenda. */
export type ReservaOnline = "si" | "consulta" | "no";
export type MonedaServicio = "ARS" | "USD";
export type UnidadDuracion = "horas" | "dias";
/** básico = suma puntos · premium = PPF, cerámico y acrílico (no suman). */
export type CategoriaFidelizacion = "basico" | "premium";

export interface VarianteServicio {
  nombre: string;
  precio: number;
  precio_hasta?: number | null;
  /** Si el precio es por unidad (ej. "llanta"), el cliente elige cantidad. */
  unidad?: string | null;
  /** Duración propia de la variante (ej. PPF combo básico = 1 día). */
  duracion_valor?: number | null;
  duracion_unidad?: UnidadDuracion | null;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  tiempo_estimado: string | null;
  puerta_a_puerta: boolean;
  /** Lista ordenada de nombres de fase, ej. ["Lavado", "Descontaminado", ...] */
  fases: string[];
  /** Precio "desde" cuando el servicio no tiene variantes. */
  precio_referencia: number | null;
  precio_hasta: number | null;
  mantenimiento_intervalo_meses: number | null;
  renovacion_meses: number | null;
  activo: boolean;
  reserva_online: ReservaOnline;
  moneda: MonedaServicio;
  variantes: VarianteServicio[];
  duracion_valor: number | null;
  duracion_unidad: UnidadDuracion | null;
  limite_dia: number | null;
  limite_semana: number | null;
  categoria_fidelizacion: CategoriaFidelizacion;
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
  precio_hasta: number | null;
  mantenimiento_intervalo_meses: number | null;
  renovacion_meses: number | null;
  reserva_online: ReservaOnline;
  moneda: MonedaServicio;
  variantes: VarianteServicio[];
  duracion_valor: number | null;
  duracion_unidad: UnidadDuracion | null;
  limite_dia: number | null;
  limite_semana: number | null;
  categoria_fidelizacion: CategoriaFidelizacion;
}

export const RESERVA_ONLINE_LABEL: Record<ReservaOnline, string> = {
  si: "Se reserva online",
  consulta: "Online, a confirmar",
  no: "No se reserva online",
};
