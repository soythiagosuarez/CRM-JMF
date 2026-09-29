import { createClient } from "@/lib/supabase/server";
import { hoyArgentina } from "@/lib/reservas/fechas";
import type { Bloqueo } from "@/lib/types/reserva";

/** Días y franjas bloqueados de hoy en adelante (Config). */
export async function listarBloqueosFuturos(): Promise<Bloqueo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agenda_bloqueos")
    .select("id, fecha, franja_desde, motivo")
    .gte("fecha", hoyArgentina())
    .order("fecha", { ascending: true })
    .order("franja_desde", { ascending: true, nullsFirst: true });
  if (error) throw new Error("No se pudieron cargar los días bloqueados: " + error.message);
  return (data ?? []).map((b) => ({
    id: b.id as string,
    fecha: b.fecha as string,
    franja_desde: b.franja_desde ? String(b.franja_desde).slice(0, 5) : null,
    motivo: (b.motivo as string | null) ?? null,
  }));
}
