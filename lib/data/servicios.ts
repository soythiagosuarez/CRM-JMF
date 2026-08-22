import { createClient } from "@/lib/supabase/server";
import type { Servicio } from "@/lib/types/servicio";

export async function listarServicios(): Promise<Servicio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los servicios: " + error.message);
  return data as Servicio[];
}
