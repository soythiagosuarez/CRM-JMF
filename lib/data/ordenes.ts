import { createClient } from "@/lib/supabase/server";
import type { Orden, OrdenConDatos } from "@/lib/types/orden";

interface OrdenCruda extends Orden {
  clientes: { nombre_completo: string; telefono: string | null } | null;
  vehiculos: { marca: string | null; modelo: string | null; patente: string | null } | null;
  servicios: { nombre: string; fases: string[] } | null;
}

async function enriquecer(ordenes: OrdenCruda[]): Promise<OrdenConDatos[]> {
  const supabase = await createClient();
  const idsAdicionales = [
    ...new Set(ordenes.flatMap((o) => o.servicios_adicionales.map((s) => s.servicio_id))),
  ];

  let nombresServicios = new Map<string, string>();
  if (idsAdicionales.length > 0) {
    const { data } = await supabase
      .from("servicios")
      .select("id, nombre")
      .in("id", idsAdicionales);
    nombresServicios = new Map((data ?? []).map((s) => [s.id as string, s.nombre as string]));
  }

  return ordenes.map((o) => ({
    ...o,
    cliente_nombre: o.clientes?.nombre_completo ?? "Cliente sin datos",
    cliente_telefono: o.clientes?.telefono ?? null,
    vehiculo_descripcion:
      [o.vehiculos?.marca, o.vehiculos?.modelo].filter(Boolean).join(" ") +
      (o.vehiculos?.patente ? ` · ${o.vehiculos.patente}` : ""),
    servicio_principal_nombre: o.servicios?.nombre ?? "Servicio eliminado",
    servicio_principal_fases: o.servicios?.fases ?? [],
    servicios_adicionales_nombres: o.servicios_adicionales.map((s) => ({
      nombre: nombresServicios.get(s.servicio_id) ?? "Servicio eliminado",
      precio: s.precio,
    })),
  }));
}

const SELECT_ENRIQUECIDO =
  "*, clientes(nombre_completo, telefono), vehiculos(marca,modelo,patente), servicios(nombre, fases)";

/**
 * Órdenes para el tablero: todas las activas, más las entregadas SOLO del
 * día de hoy (las de días anteriores ya no se muestran en el tablero,
 * quedan en el historial del cliente).
 */
export async function listarOrdenes(): Promise<OrdenConDatos[]> {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("ordenes")
    .select(SELECT_ENRIQUECIDO)
    .or(`estado.neq.entregado,fecha_entrega.eq.${hoy}`)
    .order("fecha_ingreso", { ascending: true });

  if (error) throw new Error("No se pudieron cargar las órdenes: " + error.message);
  return enriquecer(data as unknown as OrdenCruda[]);
}

/** Historial de órdenes de un cliente (para su ficha), más recientes primero. */
export async function listarOrdenesPorCliente(clienteId: string): Promise<OrdenConDatos[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ordenes")
    .select(SELECT_ENRIQUECIDO)
    .eq("cliente_id", clienteId)
    .order("fecha_ingreso", { ascending: false });

  if (error) throw new Error("No se pudo cargar el historial: " + error.message);
  return enriquecer(data as unknown as OrdenCruda[]);
}
