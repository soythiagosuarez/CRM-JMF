"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ESTADOS_CONSULTA, type EstadoConsulta } from "@/lib/types/consulta";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidar() {
  revalidatePath("/consultas");
  revalidatePath("/");
}

export async function cambiarEstadoConsulta(id: string, estado: EstadoConsulta): Promise<{ error?: string }> {
  if (!UUID.test(id) || !ESTADOS_CONSULTA.includes(estado)) return { error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultas_web")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar la consulta: " + error.message };
  revalidar();
  return {};
}

/** Al tocar «Escribirle», una consulta nueva pasa sola a «En contacto». */
export async function marcarConsultaContactada(id: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return { error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultas_web")
    .update({ estado: "en_contacto", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "nueva");
  if (error) return { error: "No se pudo actualizar la consulta: " + error.message };
  revalidar();
  return {};
}

export async function guardarNotasConsulta(id: string, notas: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return { error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultas_web")
    .update({ notas: notas.trim().slice(0, 2000) || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudieron guardar las notas: " + error.message };
  revalidar();
  return {};
}

export async function eliminarConsulta(id: string): Promise<{ error?: string }> {
  if (!UUID.test(id)) return { error: "Datos inválidos." };
  const supabase = await createClient();
  const { error } = await supabase.from("consultas_web").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la consulta: " + error.message };
  revalidar();
  return {};
}
