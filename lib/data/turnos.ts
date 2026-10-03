import { createClient } from "@/lib/supabase/server";
import type { Turno, TurnoConDatos } from "@/lib/types/turno";

interface TurnoCrudo extends Turno {
  clientes: { nombre_completo: string; telefono: string | null } | null;
  vehiculos: { marca: string | null; modelo: string | null; patente: string | null } | null;
}

const SELECT_TURNO = "*, clientes(nombre_completo, telefono), vehiculos(marca,modelo,patente)";

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

  return turnos.map((t) => {
    const detalle = Array.isArray(t.servicios_detalle) ? t.servicios_detalle : [];
    return {
      ...t,
      puerta_a_puerta: !!t.puerta_a_puerta,
      servicios_detalle: detalle,
      cliente_nombre: t.clientes?.nombre_completo ?? "Cliente sin datos",
      cliente_telefono: t.clientes?.telefono ?? null,
      vehiculo_descripcion:
        [t.vehiculos?.marca, t.vehiculos?.modelo].filter(Boolean).join(" ") +
        (t.vehiculos?.patente ? ` · ${t.vehiculos.patente}` : ""),
      servicios_nombres: t.servicios_previstos.map((id) => {
        const nombre = nombresServicios.get(id) ?? "Servicio eliminado";
        const d = detalle.find((x) => x.servicio_id === id);
        if (!d?.variante_nombre) return nombre;
        const cantidad = d.cantidad > 1 ? ` × ${d.cantidad}` : "";
        if (d.variante_nombre.toLowerCase().startsWith(nombre.toLowerCase())) return `${d.variante_nombre}${cantidad}`;
        return `${nombre} (${d.variante_nombre}${cantidad})`;
      }),
    };
  });
}

/** Turnos entre `desde` y `hasta` (inclusive, YYYY-MM-DD), para el calendario. */
export async function listarTurnosEnRango(
  desde: string,
  hasta: string
): Promise<TurnoConDatos[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("turnos")
    .select(SELECT_TURNO)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los turnos: " + error.message);
  return enriquecer(data as TurnoCrudo[]);
}

/** Reservas online que todavía no se revisaron (alerta en Inicio, respuesta 6.5). */
export async function listarReservasSinRevisar(): Promise<TurnoConDatos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(SELECT_TURNO)
    .eq("origen", "online")
    .is("revisado_en", null)
    .in("estado", ["agendado", "a_confirmar"])
    .order("created_at", { ascending: true });

  if (error) throw new Error("No se pudieron cargar las reservas online: " + error.message);
  return enriquecer(data as TurnoCrudo[]);
}

/** Turnos de un cliente para su ficha (incluye "no vino"), más recientes primero. */
export async function listarTurnosPorCliente(clienteId: string): Promise<TurnoConDatos[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(SELECT_TURNO)
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false })
    .limit(30);

  if (error) throw new Error("No se pudieron cargar los turnos del cliente: " + error.message);
  return enriquecer(data as TurnoCrudo[]);
}
