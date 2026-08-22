import { createClient } from "@/lib/supabase/server";
import type { Cliente, ClienteConVehiculos, Vehiculo } from "@/lib/types/cliente";

/**
 * Lista clientes. Con `q` busca por nombre o por patente de alguno de sus
 * vehículos (ver pantalla "Clientes" — ESPECIFICACION.md §9.8).
 */
export async function buscarClientes(q?: string): Promise<Cliente[]> {
  const supabase = await createClient();
  const query = q?.trim();

  if (!query) {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error("No se pudieron cargar los clientes: " + error.message);
    return data as Cliente[];
  }

  const [porNombre, vehiculosPorPatente] = await Promise.all([
    supabase.from("clientes").select("*").ilike("nombre_completo", `%${query}%`),
    supabase.from("vehiculos").select("cliente_id").ilike("patente", `%${query}%`),
  ]);

  if (porNombre.error) throw new Error(porNombre.error.message);
  if (vehiculosPorPatente.error) throw new Error(vehiculosPorPatente.error.message);

  const idsPorPatente = [
    ...new Set((vehiculosPorPatente.data ?? []).map((v) => v.cliente_id as string)),
  ];

  const resultado = new Map<string, Cliente>();
  for (const c of porNombre.data ?? []) resultado.set(c.id, c as Cliente);

  if (idsPorPatente.length > 0) {
    const { data: extra, error } = await supabase
      .from("clientes")
      .select("*")
      .in("id", idsPorPatente);
    if (error) throw new Error(error.message);
    for (const c of extra ?? []) resultado.set(c.id, c as Cliente);
  }

  return [...resultado.values()].sort((a, b) =>
    a.nombre_completo.localeCompare(b.nombre_completo)
  );
}

/** Todos los clientes con sus vehículos, para selects dependientes (Agenda). */
export async function listarClientesConVehiculos(): Promise<ClienteConVehiculos[]> {
  const supabase = await createClient();

  const [{ data: clientes, error: errorClientes }, { data: vehiculos, error: errorVehiculos }] =
    await Promise.all([
      supabase.from("clientes").select("*").order("nombre_completo", { ascending: true }),
      supabase.from("vehiculos").select("*"),
    ]);

  if (errorClientes) throw new Error(errorClientes.message);
  if (errorVehiculos) throw new Error(errorVehiculos.message);

  return (clientes ?? []).map((c) => ({
    ...(c as Cliente),
    vehiculos: (vehiculos ?? []).filter((v) => v.cliente_id === c.id) as Vehiculo[],
  }));
}

export async function obtenerCliente(id: string): Promise<ClienteConVehiculos | null> {
  const supabase = await createClient();

  const [{ data: cliente, error: errorCliente }, { data: vehiculos, error: errorVehiculos }] =
    await Promise.all([
      supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("vehiculos")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (errorCliente) throw new Error(errorCliente.message);
  if (errorVehiculos) throw new Error(errorVehiculos.message);
  if (!cliente) return null;

  return { ...(cliente as Cliente), vehiculos: (vehiculos ?? []) as Vehiculo[] };
}
