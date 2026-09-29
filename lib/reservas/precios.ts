/**
 * Precios de la agenda online. Los servicios de precio variable (los
 * que quedan "a confirmar" o tienen un tope "hasta") se muestran como
 * "Desde $X" — el precio final se define por WhatsApp (respuesta 4.3/4.4).
 */
import { formatARS } from "@/lib/format";
import type { MonedaServicio } from "@/lib/types/servicio";
import type { ItemReserva, ServicioPublico } from "@/lib/types/reserva";

export const AVISO_PRECIO_VARIABLE =
  "Precio aproximado. El precio final lo definimos por WhatsApp según el tamaño y el estado de tu auto y los productos que elijas.";

type ServicioPrecio = Pick<
  ServicioPublico,
  "reserva_online" | "moneda" | "variantes" | "precio_referencia" | "precio_hasta"
>;

export function formatMoneda(monto: number, moneda: MonedaServicio): string {
  if (moneda === "USD") return `USD ${Math.round(monto).toLocaleString("es-AR")}`;
  return formatARS(monto);
}

export interface PrecioItem {
  moneda: MonedaServicio;
  desde: number | null;
  hasta: number | null;
  variable: boolean;
}

export function precioItem(servicio: ServicioPrecio, item: Pick<ItemReserva, "variante" | "cantidad">): PrecioItem {
  const variante = item.variante != null ? servicio.variantes[item.variante] : undefined;
  const cantidad = variante?.unidad ? Math.max(1, item.cantidad) : 1;
  const desdeBase = variante ? variante.precio : servicio.precio_referencia;
  const hastaBase = variante ? (variante.precio_hasta ?? null) : servicio.precio_hasta;
  const desde = desdeBase != null ? desdeBase * cantidad : null;
  const hasta = hastaBase != null ? hastaBase * cantidad : null;
  return {
    moneda: servicio.moneda,
    desde,
    hasta,
    variable: servicio.reserva_online === "consulta" || hasta != null || desde == null,
  };
}

export function textoPrecio(p: PrecioItem): string {
  if (p.desde == null) return "A consultar";
  const monto = formatMoneda(p.desde, p.moneda);
  return p.variable ? `Desde ${monto}` : monto;
}

/** Precio que se muestra en la tarjeta del servicio, antes de elegir variante. */
export function textoPrecioCatalogo(servicio: ServicioPrecio): string {
  if (servicio.variantes.length === 0) {
    return textoPrecio(precioItem(servicio, { variante: null, cantidad: 1 }));
  }
  const precios = servicio.variantes.map((_, i) => precioItem(servicio, { variante: i, cantidad: 1 }));
  const minimo = Math.min(...precios.map((p) => p.desde ?? Infinity));
  if (!Number.isFinite(minimo)) return "A consultar";
  const unidad = servicio.variantes.every((v) => v.unidad) ? ` por ${servicio.variantes[0].unidad}` : "";
  const variable = precios.length > 1 || precios.some((p) => p.variable);
  const monto = formatMoneda(minimo, servicio.moneda) + unidad;
  return variable ? `Desde ${monto}` : monto;
}

/** Total aproximado de la reserva, sumado por moneda (el PPF va en dólares). */
export function textoPrecioTotal(
  servicios: (ServicioPrecio & { id: string })[],
  items: ItemReserva[]
): string {
  const totales = new Map<MonedaServicio, number>();
  let variable = false;
  let sinPrecio = false;
  for (const item of items) {
    const servicio = servicios.find((s) => s.id === item.servicio_id);
    if (!servicio) continue;
    const p = precioItem(servicio, item);
    if (p.desde == null) {
      sinPrecio = true;
      continue;
    }
    variable ||= p.variable;
    totales.set(p.moneda, (totales.get(p.moneda) ?? 0) + p.desde);
  }
  if (totales.size === 0) return "A consultar";
  const partes = (["USD", "ARS"] as MonedaServicio[])
    .filter((m) => totales.has(m))
    .map((m) => formatMoneda(totales.get(m)!, m));
  const texto = partes.join(" + ");
  return variable || sinPrecio ? `Desde ${texto}` : texto;
}

/** "Polarizado (Nano carbono)", "Restauración de llantas (Llantas diamantadas × 4)" */
export function nombreItem(
  servicio: Pick<ServicioPublico, "nombre" | "variantes">,
  item: Pick<ItemReserva, "variante" | "cantidad">
): string {
  const variante = item.variante != null ? servicio.variantes[item.variante] : undefined;
  if (!variante) return servicio.nombre;
  const cantidad = variante.unidad ? ` × ${item.cantidad}` : "";
  // "Lavado premium + cera en pasta" ya dice qué servicio es.
  if (variante.nombre.toLowerCase().startsWith(servicio.nombre.toLowerCase())) {
    return `${variante.nombre}${cantidad}`;
  }
  return `${servicio.nombre} (${variante.nombre}${cantidad})`;
}
