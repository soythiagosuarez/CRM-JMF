"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  MarcaMovimiento,
  MedioPagoMovimiento,
  MonedaMovimiento,
  TipoMovimiento,
} from "@/lib/types/movimiento";

export interface EstadoMovimientoForm {
  error?: string;
  ok?: boolean;
}

function leerMovimientoInput(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "") as TipoMovimiento;
  const marca = String(formData.get("marca") ?? "") as MarcaMovimiento;
  const categoria = String(formData.get("categoria") ?? "").trim();
  const monto = Number(formData.get("monto"));
  const moneda_original = String(formData.get("moneda_original") ?? "") as MonedaMovimiento;
  const medio_pago = (String(formData.get("medio_pago") ?? "") || null) as MedioPagoMovimiento | null;
  const fecha = String(formData.get("fecha") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const tipoCambioRaw = String(formData.get("tipo_cambio") ?? "").trim();

  if (tipo !== "ingreso" && tipo !== "egreso") return { error: "Elegí ingreso o egreso." };
  if (!marca) return { error: "Elegí la marca." };
  if (!categoria) return { error: "Elegí la categoría." };
  if (!monto || monto <= 0) return { error: "Cargá un monto válido." };
  if (!moneda_original) return { error: "Elegí la moneda." };
  if (!fecha) return { error: "Cargá la fecha." };

  let monto_ars = monto;
  let tipo_cambio: number | null = null;
  if (moneda_original !== "ARS") {
    tipo_cambio = Number(tipoCambioRaw);
    if (!tipo_cambio || tipo_cambio <= 0) {
      return { error: "Cargá el tipo de cambio del día para convertir a pesos." };
    }
    monto_ars = monto * tipo_cambio;
  }

  return {
    tipo,
    marca,
    categoria,
    monto,
    moneda_original,
    monto_ars,
    tipo_cambio,
    medio_pago,
    fecha,
    descripcion,
  };
}

/**
 * Alta manual de movimiento — ESPECIFICACION.md §7 regla 1: esto es
 * únicamente para plata suelta. Los ingresos de órdenes cobradas, autos
 * vendidos o ventas de Shop se generan solos desde esos módulos.
 */
export async function crearMovimiento(
  _prevState: EstadoMovimientoForm,
  formData: FormData
): Promise<EstadoMovimientoForm> {
  const input = leerMovimientoInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("movimientos").insert({ ...input, origen: "manual" });

  if (error) return { error: "No se pudo cargar el movimiento: " + error.message };

  revalidatePath("/finanzas");
  return { ok: true };
}

/**
 * Editar movimiento — se permite en cualquier origen (manual o
 * automático) para poder corregir errores de tipeo (ej. un cobro de
 * orden cargado con el monto mal). Ojo: esto corrige el asiento en
 * Finanzas pero no actualiza el monto que muestra la Orden/Venta/Auto
 * de origen — ver aviso en el formulario.
 */
export async function actualizarMovimiento(
  id: string,
  _prevState: EstadoMovimientoForm,
  formData: FormData
): Promise<EstadoMovimientoForm> {
  const input = leerMovimientoInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("movimientos").update(input).eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/finanzas");
  return { ok: true };
}

/** Borrar movimiento — cualquier origen. Si es automático, la Orden/
 * Venta/Auto de origen sigue mostrando que se cobró/vendió (no se
 * revierte desde acá); el aviso está en la confirmación del botón. */
export async function eliminarMovimiento(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("movimientos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/finanzas");
  return {};
}
