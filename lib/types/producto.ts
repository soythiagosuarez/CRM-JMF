/**
 * Producto (Shop) — ESPECIFICACION.md §6.9.
 */
export interface Producto {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number | null;
  precio_costo: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductoInput {
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number | null;
  precio_costo: number | null;
}
