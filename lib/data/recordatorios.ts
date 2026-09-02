import { createClient } from "@/lib/supabase/server";
import type { Recordatorio, RecordatorioConDatos } from "@/lib/types/recordatorio";

interface RecordatorioCrudo extends Recordatorio {
  clientes: { nombre_completo: string; telefono: string | null } | null;
  vehiculos: { marca: string | null; modelo: string | null; patente: string | null } | null;
}

/**
 * Auto-completa los recordatorios con fecha exacta + "auto_completar" que
 * ya vencieron (§ feedback: si el usuario puso fecha precisa, se marca
 * hecho solo ese día — sin cron, se resuelve al leer la lista).
 */
async function autoCompletarVencidos(supabase: Awaited<ReturnType<typeof createClient>>) {
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("recordatorios")
    .update({ estado: "hecho" })
    .eq("estado", "pendiente")
    .eq("auto_completar", true)
    .not("fecha_proxima", "is", null)
    .lte("fecha_proxima", hoy);
  if (error) throw new Error("No se pudieron actualizar los recordatorios vencidos: " + error.message);
}

export async function listarRecordatorios(): Promise<RecordatorioConDatos[]> {
  const supabase = await createClient();
  await autoCompletarVencidos(supabase);
  const { data, error } = await supabase
    .from("recordatorios")
    .select("*, clientes(nombre_completo, telefono), vehiculos(marca,modelo,patente)")
    .order("fecha_proxima", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los recordatorios: " + error.message);

  return (data as unknown as RecordatorioCrudo[]).map((r) => ({
    ...r,
    cliente_nombre:
      r.clientes?.nombre_completo ?? (r.tipo === "nota" ? null : "Cliente sin datos"),
    cliente_telefono: r.clientes?.telefono ?? null,
    vehiculo_descripcion: r.vehiculos
      ? [r.vehiculos.marca, r.vehiculos.modelo].filter(Boolean).join(" ") +
        (r.vehiculos.patente ? ` · ${r.vehiculos.patente}` : "")
      : null,
  }));
}
