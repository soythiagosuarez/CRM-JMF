import { createClient } from "@/lib/supabase/server";
import type { AutoClassmotor } from "@/lib/types/classmotor";

export async function listarAutosClassmotor(): Promise<AutoClassmotor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("autos_classmotor")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los autos: " + error.message);
  return data as AutoClassmotor[];
}
