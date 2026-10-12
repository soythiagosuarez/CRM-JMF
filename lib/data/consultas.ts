import { createClient } from "@/lib/supabase/server";
import type { ConsultaWeb, EstadoConsulta } from "@/lib/types/consulta";

export interface ConsultaConFecha extends ConsultaWeb {
  /** "lun 12/10 · 15:30", armado en el servidor (hora de Argentina). */
  fecha_texto: string;
}

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function conFecha(c: ConsultaWeb): ConsultaConFecha {
  const partes = Object.fromEntries(formatoFecha.formatToParts(new Date(c.created_at)).map((p) => [p.type, p.value]));
  return {
    ...c,
    fecha_texto: `${String(partes.weekday).replace(".", "")} ${partes.day}/${partes.month} · ${partes.hour}:${partes.minute}`,
  };
}

/** Consultas de la web, las más nuevas primero. */
export async function listarConsultas(estados?: EstadoConsulta[]): Promise<ConsultaConFecha[]> {
  const supabase = await createClient();
  let query = supabase.from("consultas_web").select("*").order("created_at", { ascending: false }).limit(300);
  if (estados && estados.length > 0) query = query.in("estado", estados);
  const { data, error } = await query;
  if (error) throw new Error("No se pudieron cargar las consultas: " + error.message);
  return ((data ?? []) as ConsultaWeb[]).map(conFecha);
}

/** Cuántas hay en cada estado (para las pestañas). */
export async function contarConsultasPorEstado(): Promise<Record<EstadoConsulta, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("consultas_web").select("estado");
  if (error) throw new Error("No se pudieron contar las consultas: " + error.message);
  const conteo: Record<EstadoConsulta, number> = { nueva: 0, en_contacto: 0, concretada: 0, descartada: 0 };
  for (const fila of data ?? []) {
    const estado = fila.estado as EstadoConsulta;
    if (estado in conteo) conteo[estado]++;
  }
  return conteo;
}

/** Para el aviso en Inicio. Si la tabla todavía no existe (falta la
 * migración 0011), Inicio sigue andando sin el aviso. */
export async function listarConsultasNuevas(): Promise<ConsultaConFecha[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consultas_web")
    .select("*")
    .eq("estado", "nueva")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("Consultas web no disponibles", error.message);
    return [];
  }
  return ((data ?? []) as ConsultaWeb[]).map(conFecha);
}
