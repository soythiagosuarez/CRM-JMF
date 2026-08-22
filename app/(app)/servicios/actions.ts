"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ServicioInput } from "@/lib/types/servicio";

export interface EstadoServicioForm {
  error?: string;
  ok?: boolean;
}

function leerInput(formData: FormData): ServicioInput | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const fasesRaw = String(formData.get("fases") ?? "");
  const fases = fasesRaw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  if (fases.length === 0) {
    return { error: "Cargá al menos una fase (una por línea, en orden)." };
  }

  const numeroOpcional = (valor: FormDataEntryValue | null) => {
    const s = String(valor ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return {
    nombre,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    tiempo_estimado: String(formData.get("tiempo_estimado") ?? "").trim() || null,
    puerta_a_puerta: formData.get("puerta_a_puerta") === "on",
    fases,
    precio_referencia: numeroOpcional(formData.get("precio_referencia")),
    mantenimiento_intervalo_meses: numeroOpcional(
      formData.get("mantenimiento_intervalo_meses")
    ),
    renovacion_meses: numeroOpcional(formData.get("renovacion_meses")),
  };
}

export async function crearServicio(
  _prevState: EstadoServicioForm,
  formData: FormData
): Promise<EstadoServicioForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert(input);

  if (error) return { error: "No se pudo crear el servicio: " + error.message };

  revalidatePath("/servicios");
  return { ok: true };
}

export async function actualizarServicio(
  id: string,
  _prevState: EstadoServicioForm,
  formData: FormData
): Promise<EstadoServicioForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").update(input).eq("id", id);

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/servicios");
  return { ok: true };
}

export async function cambiarActivoServicio(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("servicios")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/servicios");
}
