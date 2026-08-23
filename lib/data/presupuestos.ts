import { createClient } from "@/lib/supabase/server";
import type { Presupuesto } from "@/lib/types/presupuesto";

export async function listarPresupuestos(): Promise<Presupuesto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron cargar los presupuestos: " + error.message);
  return data as Presupuesto[];
}

export async function obtenerPresupuesto(id: string): Promise<Presupuesto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Presupuesto | null;
}
