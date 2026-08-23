"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoPresupuesto, ItemPresupuesto } from "@/lib/types/presupuesto";

export interface EstadoForm {
  error?: string;
  ok?: boolean;
}

/**
 * Crea el presupuesto. No toca Clientes ni Vehículos — es un generador
 * independiente (ver feedback de producto: atarlo a Cliente creaba
 * "clientes" reales antes de que el presupuesto se acepte).
 */
export async function crearPresupuesto(
  _prevState: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  const nombre_contacto = String(formData.get("nombre_contacto") ?? "").trim();
  if (!nombre_contacto) return { error: "Cargá el nombre del contacto." };

  const nombres = formData.getAll("servicio_nombre").map(String);
  const precios = formData.getAll("servicio_precio").map(Number);
  const servicios: ItemPresupuesto[] = nombres
    .map((nombre, i) => ({ nombre, precio: precios[i] }))
    .filter((s) => s.nombre.trim() && s.precio > 0);

  if (servicios.length === 0) {
    return { error: "Agregá al menos un servicio con precio." };
  }

  const hoy = new Date();
  const validez = new Date(hoy);
  validez.setDate(validez.getDate() + 7);

  const supabase = await createClient();
  const { error } = await supabase.from("presupuestos").insert({
    nombre_contacto,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    vehiculo_marca: String(formData.get("vehiculo_marca") ?? "").trim() || null,
    vehiculo_modelo: String(formData.get("vehiculo_modelo") ?? "").trim() || null,
    vehiculo_patente: String(formData.get("vehiculo_patente") ?? "").trim().toUpperCase() || null,
    que_observo: String(formData.get("que_observo") ?? "").trim() || null,
    servicios,
    tiempo_estimado: String(formData.get("tiempo_estimado") ?? "").trim() || null,
    fecha: hoy.toISOString().slice(0, 10),
    validez: validez.toISOString().slice(0, 10),
  });

  if (error) return { error: "No se pudo crear el presupuesto: " + error.message };

  revalidatePath("/presupuestos");
  return { ok: true };
}

export async function cambiarEstadoPresupuesto(id: string, estado: EstadoPresupuesto) {
  const supabase = await createClient();
  const { error } = await supabase.from("presupuestos").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}

export async function eliminarPresupuesto(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("presupuestos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar: " + error.message };
  revalidatePath("/presupuestos");
  return {};
}
