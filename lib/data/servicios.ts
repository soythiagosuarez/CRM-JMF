import { createClient } from "@/lib/supabase/server";
import { normalizarVariantes } from "@/lib/reservas/catalogo";
import type { Servicio } from "@/lib/types/servicio";

export async function listarServicios(): Promise<Servicio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los servicios: " + error.message);
  return (data as Servicio[]).map((s) => ({
    ...s,
    reserva_online: s.reserva_online ?? "no",
    moneda: s.moneda === "USD" ? "USD" : "ARS",
    variantes: normalizarVariantes(s.variantes),
    categoria_fidelizacion: s.categoria_fidelizacion === "premium" ? "premium" : "basico",
  }));
}
