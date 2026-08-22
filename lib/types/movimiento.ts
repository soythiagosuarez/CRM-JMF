/**
 * Movimiento (Finanzas) — el corazón del sistema. ESPECIFICACION.md §6.7.
 */
export type TipoMovimiento = "ingreso" | "egreso";
export type MarcaMovimiento = "detailing" | "shop" | "classmotor" | "compartido";
export type MedioPagoMovimiento =
  | "efectivo_pesos"
  | "efectivo_dolares"
  | "transferencia"
  | "cheque"
  | "usdt";
export type MonedaMovimiento = "ARS" | "USD" | "USDT" | "cheque";
export type OrigenMovimiento = "manual" | "orden" | "classmotor" | "shop";

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  marca: MarcaMovimiento;
  categoria: string;
  monto: number;
  moneda_original: MonedaMovimiento;
  monto_ars: number;
  tipo_cambio: number | null;
  medio_pago: MedioPagoMovimiento | null;
  fecha: string;
  origen: OrigenMovimiento;
  ref_origen: string | null;
  descripcion: string | null;
  created_at: string;
}

/**
 * Categorías por marca y tipo — ESPECIFICACION.md §6.7.1 (datos reales,
 * no inventar otras).
 */
export const CATEGORIAS: Record<TipoMovimiento, Record<MarcaMovimiento, string[]>> = {
  egreso: {
    compartido: ["Alquiler", "Luz", "Agua", "Servicios", "Equipo de marketing/comunicación"],
    detailing: ["Insumos", "Productos de trabajo", "Sueldos"],
    shop: ["Compra de mercadería", "Pauta"],
    classmotor: [
      "Pauta",
      "Compra de autos",
      "Patentamientos",
      "Arreglos",
      "Transferencia",
      "Productos para reparar",
    ],
  },
  ingreso: {
    compartido: [],
    detailing: ["Servicios"],
    shop: ["Venta de productos"],
    classmotor: ["Ganancia por auto vendido"],
  },
};

export const MARCA_LABEL: Record<MarcaMovimiento, string> = {
  detailing: "Detailing",
  shop: "Shop",
  classmotor: "Classmotor",
  compartido: "Compartido",
};
