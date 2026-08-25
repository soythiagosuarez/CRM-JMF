/**
 * Auto Classmotor (ficha) — ESPECIFICACION.md §6.8.
 */
export type TipoAutoClassmotor = "compra_venta" | "preventa_venta";
export type EstadoAutoClassmotor =
  | "ingresa"
  | "en_preparacion_estetica"
  | "sesion_fotos_contenido"
  | "publicado_pautado"
  | "cliente_viene_a_verlo"
  | "vendido";

export interface CostoExtra {
  concepto: string;
  monto: number;
}

export interface AutoClassmotor {
  id: string;
  tipo: TipoAutoClassmotor;
  cliente_id: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  km: number | null;
  patente: string | null;
  color: string | null;
  detalles: string | null;
  precio_base: number | null;
  precio_venta: number | null;
  costos_extra: CostoExtra[];
  estado: EstadoAutoClassmotor;
  fecha_ingreso: string | null;
  hora_ingreso: string | null;
  fecha_venta: string | null;
  created_at: string;
  updated_at: string;
}

export const ESTADO_LABEL: Record<EstadoAutoClassmotor, string> = {
  ingresa: "Ingresa",
  en_preparacion_estetica: "En preparación estética",
  sesion_fotos_contenido: "Sesión de fotos y contenido",
  publicado_pautado: "Publicado y pautado",
  cliente_viene_a_verlo: "Cliente viene a verlo",
  vendido: "Vendido",
};

export const ORDEN_ESTADOS: EstadoAutoClassmotor[] = [
  "ingresa",
  "en_preparacion_estetica",
  "sesion_fotos_contenido",
  "publicado_pautado",
  "cliente_viene_a_verlo",
  "vendido",
];

/** Conceptos de costos extra — mismas categorías de egreso de Classmotor (§6.7.1). */
export const CONCEPTOS_COSTO_EXTRA = [
  "Pauta",
  "Patentamientos",
  "Arreglos",
  "Transferencia",
  "Productos para reparar",
];

export function calcularGanancia(auto: AutoClassmotor): number {
  const costos = auto.costos_extra.reduce((acc, c) => acc + c.monto, 0);
  return (auto.precio_venta ?? 0) - (auto.precio_base ?? 0) - costos;
}
