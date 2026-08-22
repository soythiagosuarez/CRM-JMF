/**
 * Orden (Detailing) — ESPECIFICACION.md §6.5. Nace de un turno.
 * Regla clave (§7.2): el precio_total NO es ingreso hasta que
 * estado_pago = "cobrado".
 */
export type EstadoOrden = "en_cola" | "en_proceso" | "terminado" | "entregado";
export type EstadoPago = "pendiente" | "cobrado";
export type Entrega = "retira" | "puerta_a_puerta";
export type FlagOrden = "esperando_repuesto_producto" | "esperando_cliente" | "demorado";
export type MedioPago =
  | "efectivo_pesos"
  | "efectivo_dolares"
  | "transferencia"
  | "cheque"
  | "usdt";
export type MonedaPago = "ARS" | "USD" | "USDT" | "cheque";

export interface ServicioAdicional {
  servicio_id: string;
  precio: number;
}

export interface Orden {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  turno_id: string | null;
  servicio_principal_id: string;
  servicios_adicionales: ServicioAdicional[];
  precio_total: number | null;
  fase_actual: string | null;
  estado: EstadoOrden;
  flags: FlagOrden[];
  entrega: Entrega | null;
  estado_pago: EstadoPago;
  medio_pago: MedioPago | null;
  monto_cobrado: number | null;
  moneda: MonedaPago | null;
  monto_ars: number | null;
  fecha_cobro: string | null;
  fecha_ingreso: string | null;
  fecha_entrega: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdenConDatos extends Orden {
  cliente_nombre: string;
  cliente_telefono: string | null;
  vehiculo_descripcion: string;
  servicio_principal_nombre: string;
  servicio_principal_fases: string[];
  servicios_adicionales_nombres: { nombre: string; precio: number }[];
}
