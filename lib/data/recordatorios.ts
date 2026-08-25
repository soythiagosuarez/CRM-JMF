import { createClient } from "@/lib/supabase/server";
import type { Recordatorio, RecordatorioConDatos } from "@/lib/types/recordatorio";

interface RecordatorioCrudo extends Recordatorio {
  clientes: { nombre_completo: string; telefono: string | null } | null;
  vehiculos: { marca: string | null; modelo: string | null; patente: string | null } | null;
}

export async function listarRecordatorios(): Promise<RecordatorioConDatos[]> {
  const supabase = await createClient();
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
