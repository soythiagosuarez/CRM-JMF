"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoRecordatorio } from "@/lib/types/recordatorio";

export async function cambiarEstadoRecordatorio(id: string, estado: EstadoRecordatorio) {
  const supabase = await createClient();
  const { error } = await supabase.from("recordatorios").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recordatorios");
}

export interface EstadoFechaForm {
  error?: string;
  ok?: boolean;
}

/** La fecha/intervalo por defecto son editables (§6.10). */
export async function actualizarRecordatorio(
  id: string,
  _prevState: EstadoFechaForm,
  formData: FormData
): Promise<EstadoFechaForm> {
  const fecha_proxima = String(formData.get("fecha_proxima") ?? "").trim();
  if (!fecha_proxima) return { error: "Cargá la próxima fecha." };

  const intervaloRaw = String(formData.get("intervalo_meses") ?? "").trim();
  const intervalo_meses = intervaloRaw ? Number(intervaloRaw) : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("recordatorios")
    .update({ fecha_proxima, intervalo_meses })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/recordatorios");
  return { ok: true };
}
