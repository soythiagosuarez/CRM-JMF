import { createClient } from "@/lib/supabase/server";
import type { Turno, TurnoConDatos } from "@/lib/types/turno";

interface TurnoCrudo extends Turno {
  clientes: { nombre_completo: string } | null;
  vehiculos: { marca: string | null; modelo: string | null; patente: string | null } | null;
}

async function enriquecer(turnos: TurnoCrudo[]): Promise<TurnoConDatos[]> {
  const supabase = await createClient();
  const idsServicios = [...new Set(turnos.flatMap((t) => t.servicios_previstos))];

  let nombresServicios = new Map<string, string>();
  if (idsServicios.length > 0) {
    const { data } = await supabase
      .from("servicios")
      .select("id, nombre")
      .in("id", idsServicios);
    nombresServicios = new Map((data ?? []).map((s) => [s.id as string, s.nombre as string]));
  }

  return turnos.map((t) => ({
    ...t,
    cliente_nombre: t.clientes?.nombre_completo ?? "Cliente sin datos",
    vehiculo_descripcion:
      [t.vehiculos?.marca, t.vehiculos?.modelo].filter(Boolean).join(" ") +
      (t.vehiculos?.patente ? ` · ${t.vehiculos.patente}` : ""),
    servicios_nombres: t.servicios_previstos.map(
      (id) => nombresServicios.get(id) ?? "Servicio eliminado"
    ),
  }));
}

/** Turnos desde hoy en adelante (no cancelados primero), para la Agenda. */
export async function listarProximosTurnos(): Promise<TurnoConDatos[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("turnos")
    .select("*, clientes(nombre_completo), vehiculos(marca,modelo,patente)")
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los turnos: " + error.message);
  return enriquecer(data as TurnoCrudo[]);
}
