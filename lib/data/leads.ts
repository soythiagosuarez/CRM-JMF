import { createClient } from "@/lib/supabase/server";
import type { Lead, LeadConDatos } from "@/lib/types/lead";

interface LeadCrudo extends Lead {
  clientes: { nombre_completo: string; telefono: string | null } | null;
}

async function enriquecer(leads: LeadCrudo[]): Promise<LeadConDatos[]> {
  const supabase = await createClient();
  const idsServicios = [...new Set(leads.flatMap((l) => l.servicios_consultados))];

  let nombresServicios = new Map<string, string>();
  if (idsServicios.length > 0) {
    const { data } = await supabase.from("servicios").select("id, nombre").in("id", idsServicios);
    nombresServicios = new Map((data ?? []).map((s) => [s.id as string, s.nombre as string]));
  }

  return leads.map((l) => ({
    ...l,
    cliente_nombre: l.clientes?.nombre_completo ?? "Cliente sin datos",
    cliente_telefono: l.clientes?.telefono ?? null,
    servicios_consultados_nombres: l.servicios_consultados.map(
      (id) => nombresServicios.get(id) ?? "Servicio eliminado"
    ),
  }));
}

export async function listarLeads(): Promise<LeadConDatos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, clientes(nombre_completo, telefono)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("No se pudieron cargar los leads: " + error.message);
  return enriquecer(data as unknown as LeadCrudo[]);
}

export async function obtenerLead(id: string): Promise<LeadConDatos | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, clientes(nombre_completo, telefono)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const [enriquecido] = await enriquecer([data as unknown as LeadCrudo]);
  return enriquecido;
}
