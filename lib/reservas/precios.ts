/**
 * Precios de la agenda online. Cada servicio (o cada opción de un
 * servicio) muestra su precio de lista; si tiene un tope se muestra el
 * rango ("USD 3.000 – USD 4.000"). Solo los que se cotizan con una foto
 * por WhatsApp (Sacabollo: precio sin opciones y con tope) llevan
 * "Desde" adelante del precio.
 */
import { formatARS } from "@/lib/format";
import type { MonedaServicio } from "@/lib/types/servicio";
import type { ItemReserva, ServicioPublico } from "@/lib/types/reserva";

export const AVISO_COTIZACION =
  "El precio final de Sacabollo depende del bollo: mandanos una foto por WhatsApp y te lo cotizamos.";

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

/** Se cotiza con una foto por WhatsApp: sin opciones y con un tope de
 * precio (hoy, Sacabollo). Es el único caso que lleva "Desde". */
export function seCotizaPorFoto(servicio: Pick<ServicioPrecio, "variantes" | "precio_hasta">): boolean {
  return servicio.variantes.length === 0 && servicio.precio_hasta != null;
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
    variable: (!variante && seCotizaPorFoto(servicio)) || desde == null,
  };
}

export function textoPrecio(p: PrecioItem): string {
  if (p.desde == null) return "A consultar";
  const monto = formatMoneda(p.desde, p.moneda);
  if (p.variable) return `Desde ${monto}`;
  if (p.hasta != null && p.hasta > p.desde) return `${monto} – ${formatMoneda(p.hasta, p.moneda)}`;
  return monto;
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
  const minimos = new Map<MonedaServicio, number>();
  const maximos = new Map<MonedaServicio, number>();
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
    minimos.set(p.moneda, (minimos.get(p.moneda) ?? 0) + p.desde);
    // Lo que se cotiza por foto no suma tope: va como "Desde".
    const tope = p.variable ? p.desde : (p.hasta ?? p.desde);
    maximos.set(p.moneda, (maximos.get(p.moneda) ?? 0) + tope);
  }
  if (minimos.size === 0) return "A consultar";
  const partes = (["USD", "ARS"] as MonedaServicio[])
    .filter((m) => minimos.has(m))
    .map((m) => {
      const min = minimos.get(m)!;
      const max = maximos.get(m)!;
      return max > min && !variable
        ? `${formatMoneda(min, m)} – ${formatMoneda(max, m)}`
        : formatMoneda(min, m);
    });
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
