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

export interface EstadoNotaForm {
  error?: string;
  ok?: boolean;
}

/**
 * Recordatorio libre, sin cliente/vehículo/orden — para que el usuario
 * también pueda usar esta sección para su marca en general (grabar
 * contenido, pagar factura de luz, hablarle a un proveedor, etc).
 */
export async function crearRecordatorioNota(
  _prevState: EstadoNotaForm,
  formData: FormData
): Promise<EstadoNotaForm> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { error: "Cargá qué hay que hacer." };

  const fecha_proxima = String(formData.get("fecha_proxima") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("recordatorios").insert({
    tipo: "nota",
    titulo,
    fecha_proxima,
    estado: "pendiente",
  });
  if (error) return { error: "No se pudo cargar el recordatorio: " + error.message };

  revalidatePath("/recordatorios");
  return { ok: true };
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
