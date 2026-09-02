import { createClient } from "@/lib/supabase/server";
import type { Configuracion } from "@/lib/types/config";

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracion")
    .select("*")
    .eq("id", "global")
    .single();

  if (error) {
    throw new Error(
      "No se pudo cargar la configuración: " + error.message
    );
  }

  return data as Configuracion;
}
