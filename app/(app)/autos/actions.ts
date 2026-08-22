"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Entrega, FlagOrden, MedioPago, MonedaPago } from "@/lib/types/orden";

async function obtenerFasesServicio(servicioId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios")
    .select("fases")
    .eq("id", servicioId)
    .single();
  if (error) throw new Error(error.message);
  return (data?.fases as string[]) ?? [];
}

/**
 * Avanza a la siguiente fase del servicio principal. Si ya está en la
 * última fase, marca la orden como terminada (§6.5).
 */
export async function avanzarFase(ordenId: string) {
  const supabase = await createClient();
  const { data: orden, error } = await supabase
    .from("ordenes")
    .select("servicio_principal_id, fase_actual, estado")
    .eq("id", ordenId)
    .single();
  if (error) throw new Error(error.message);

  const fases = await obtenerFasesServicio(orden.servicio_principal_id);
  const indiceActual = fases.indexOf(orden.fase_actual ?? "");

  if (indiceActual === -1 || indiceActual === fases.length - 1) {
    const { error: errorUpdate } = await supabase
      .from("ordenes")
      .update({ estado: "terminado" })
      .eq("id", ordenId);
    if (errorUpdate) throw new Error(errorUpdate.message);
  } else {
    const { error: errorUpdate } = await supabase
      .from("ordenes")
      .update({
        fase_actual: fases[indiceActual + 1],
        estado: orden.estado === "en_cola" ? "en_proceso" : orden.estado,
      })
      .eq("id", ordenId);
    if (errorUpdate) throw new Error(errorUpdate.message);
  }

  revalidatePath("/autos");
}

export async function retrocederFase(ordenId: string) {
  const supabase = await createClient();
  const { data: orden, error } = await supabase
    .from("ordenes")
    .select("servicio_principal_id, fase_actual, estado")
    .eq("id", ordenId)
    .single();
  if (error) throw new Error(error.message);

  const fases = await obtenerFasesServicio(orden.servicio_principal_id);
  const indiceActual = fases.indexOf(orden.fase_actual ?? "");
  if (indiceActual <= 0) return;

  const { error: errorUpdate } = await supabase
    .from("ordenes")
    .update({
      fase_actual: fases[indiceActual - 1],
      estado: orden.estado === "terminado" ? "en_proceso" : orden.estado,
    })
    .eq("id", ordenId);
  if (errorUpdate) throw new Error(errorUpdate.message);

  revalidatePath("/autos");
}

export async function toggleFlag(ordenId: string, flag: FlagOrden) {
  const supabase = await createClient();
  const { data: orden, error } = await supabase
    .from("ordenes")
    .select("flags")
    .eq("id", ordenId)
    .single();
  if (error) throw new Error(error.message);

  const flagsActuales = (orden.flags as FlagOrden[]) ?? [];
  const nuevos = flagsActuales.includes(flag)
    ? flagsActuales.filter((f) => f !== flag)
    : [...flagsActuales, flag];

  const { error: errorUpdate } = await supabase
    .from("ordenes")
    .update({ flags: nuevos })
    .eq("id", ordenId);
  if (errorUpdate) throw new Error(errorUpdate.message);

  revalidatePath("/autos");
}

export interface EstadoPrecioForm {
  error?: string;
  ok?: boolean;
}

export async function actualizarPrecio(
  ordenId: string,
  _prevState: EstadoPrecioForm,
  formData: FormData
): Promise<EstadoPrecioForm> {
  const precioRaw = String(formData.get("precio_total") ?? "").trim();
  const precio_total = precioRaw ? Number(precioRaw) : null;
  if (precioRaw && (!Number.isFinite(precio_total) || precio_total! < 0)) {
    return { error: "El precio no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ordenes")
    .update({ precio_total })
    .eq("id", ordenId);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/autos");
  return { ok: true };
}

export interface EstadoCobroForm {
  error?: string;
  ok?: boolean;
}

/**
 * Marca la orden como cobrada y genera el Movimiento correspondiente.
 * Regla anti-doble-conteo (§7.1 y §7.2): el ingreso se registra recién acá,
 * nunca al acordar el precio.
 */
export async function marcarCobrado(
  ordenId: string,
  _prevState: EstadoCobroForm,
  formData: FormData
): Promise<EstadoCobroForm> {
  const monto = Number(formData.get("monto"));
  const moneda = String(formData.get("moneda") ?? "") as MonedaPago;
  const medio_pago = String(formData.get("medio_pago") ?? "") as MedioPago;
  const tipoCambioRaw = String(formData.get("tipo_cambio") ?? "").trim();
  const fecha_cobro = String(formData.get("fecha_cobro") ?? "").trim();

  if (!monto || monto <= 0) return { error: "Cargá un monto válido." };
  if (!moneda) return { error: "Elegí la moneda." };
  if (!medio_pago) return { error: "Elegí el medio de pago." };
  if (!fecha_cobro) return { error: "Cargá la fecha de cobro." };

  let monto_ars = monto;
  let tipo_cambio: number | null = null;
  if (moneda !== "ARS") {
    tipo_cambio = Number(tipoCambioRaw);
    if (!tipo_cambio || tipo_cambio <= 0) {
      return { error: "Cargá el tipo de cambio del día para convertir a pesos." };
    }
    monto_ars = monto * tipo_cambio;
  }

  const supabase = await createClient();

  const { error: errorOrden } = await supabase
    .from("ordenes")
    .update({
      estado_pago: "cobrado",
      medio_pago,
      monto_cobrado: monto,
      moneda,
      monto_ars,
      fecha_cobro,
    })
    .eq("id", ordenId);
  if (errorOrden) return { error: "No se pudo marcar como cobrado: " + errorOrden.message };

  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "ingreso",
    marca: "detailing",
    categoria: "servicios",
    monto,
    moneda_original: moneda,
    monto_ars,
    tipo_cambio,
    medio_pago,
    fecha: fecha_cobro,
    origen: "orden",
    ref_origen: ordenId,
    descripcion: "Cobro de orden de servicio",
  });
  if (errorMovimiento) {
    return { error: "La orden se marcó cobrada pero falló el movimiento: " + errorMovimiento.message };
  }

  revalidatePath("/autos");
  revalidatePath("/finanzas");
  return { ok: true };
}

export async function marcarEntrega(ordenId: string, entrega: Entrega) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("ordenes")
    .update({ estado: "entregado", entrega, fecha_entrega: hoy })
    .eq("id", ordenId);
  if (error) throw new Error(error.message);

  // TODO: cuando exista el módulo Recordatorios, acá se generan los
  // recordatorios de mantenimiento/renovación si el servicio es un
  // tratamiento (ver ESPECIFICACION.md §6.10).
  revalidatePath("/autos");
}
