"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProductoInput } from "@/lib/types/producto";

export interface EstadoFormulario {
  error?: string;
  ok?: boolean;
}

function leerInput(formData: FormData): ProductoInput | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const stock_actual = Number(formData.get("stock_actual") ?? 0);
  const stock_minimo = Number(formData.get("stock_minimo") ?? 4);
  if (!Number.isFinite(stock_actual) || stock_actual < 0) {
    return { error: "El stock actual no es válido." };
  }
  if (!Number.isFinite(stock_minimo) || stock_minimo < 0) {
    return { error: "El stock mínimo no es válido." };
  }

  const numeroOpcional = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return {
    nombre,
    stock_actual,
    stock_minimo,
    precio_venta: numeroOpcional(formData.get("precio_venta")),
    precio_costo: numeroOpcional(formData.get("precio_costo")),
  };
}

export async function crearProducto(
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("productos").insert(input);
  if (error) return { error: "No se pudo cargar el producto: " + error.message };

  revalidatePath("/shop");
  return { ok: true };
}

export async function actualizarProducto(
  id: string,
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("productos").update(input).eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/shop");
  return { ok: true };
}

export async function eliminarProducto(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar: " + error.message };

  revalidatePath("/shop");
  return {};
}

export interface EstadoVentaForm {
  error?: string;
  ok?: boolean;
}

/**
 * Vender un producto: descuenta stock y genera el Movimiento de ingreso
 * correspondiente — ESPECIFICACION.md §6.9.
 */
export async function venderProducto(
  productoId: string,
  _prevState: EstadoVentaForm,
  formData: FormData
): Promise<EstadoVentaForm> {
  const cantidad = Number(formData.get("cantidad"));
  const precioUnitario = Number(formData.get("precio_unitario"));
  const fecha = String(formData.get("fecha") ?? "").trim();
  const medio_pago = String(formData.get("medio_pago") ?? "").trim();

  if (!cantidad || cantidad <= 0) return { error: "Cargá una cantidad válida." };
  if (!precioUnitario || precioUnitario <= 0) return { error: "Cargá un precio válido." };
  if (!fecha) return { error: "Cargá la fecha." };
  if (!medio_pago) return { error: "Elegí el medio de pago." };

  const supabase = await createClient();
  const { data: producto, error: errorGet } = await supabase
    .from("productos")
    .select("nombre, stock_actual")
    .eq("id", productoId)
    .single();
  if (errorGet) return { error: errorGet.message };

  if (cantidad > producto.stock_actual) {
    return { error: `Solo quedan ${producto.stock_actual} unidades en stock.` };
  }

  const { error: errorStock } = await supabase
    .from("productos")
    .update({ stock_actual: producto.stock_actual - cantidad })
    .eq("id", productoId);
  if (errorStock) return { error: "No se pudo descontar el stock: " + errorStock.message };

  const monto = precioUnitario * cantidad;
  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "ingreso",
    marca: "shop",
    categoria: "Venta de productos",
    monto,
    moneda_original: "ARS",
    monto_ars: monto,
    medio_pago,
    fecha,
    origen: "shop",
    ref_origen: productoId,
    descripcion: `${cantidad} x ${producto.nombre}`,
  });
  if (errorMovimiento) {
    return { error: "El stock se descontó pero falló el movimiento: " + errorMovimiento.message };
  }

  revalidatePath("/shop");
  revalidatePath("/finanzas");
  return { ok: true };
}
