import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarConsultaWeb } from "@/lib/consultas/validar";
import { SITIOS_WEB_JMF } from "@/lib/web-jmf";

/**
 * Recibe el formulario de Contacto de la web de JMF Detailing (GitHub
 * Pages) y lo guarda en Consultas web. Público: valida todo, frena bots
 * con un campo trampa y limita cuántas consultas entran por celular y
 * por conexión.
 */

/** Sitios que pueden mandar consultas: la web de JMF (ver lib/web-jmf.ts)
 * y los que se sumen con la variable CONSULTAS_ORIGENES (separados por coma). */
const ORIGENES_PERMITIDOS = [
  ...SITIOS_WEB_JMF,
  ...(process.env.CONSULTAS_ORIGENES ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

const MAX_POR_CELULAR_DIA = 3;
const MAX_POR_CONEXION_DIA = 10;
const MAX_BYTES = 20_000;

function origenPermitido(origen: string | null): string | null {
  if (!origen) return null;
  if (ORIGENES_PERMITIDOS.includes(origen)) return origen;
  if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(origen)) return origen;
  return null;
}

function cabecerasCors(origen: string | null): HeadersInit {
  const permitido = origenPermitido(origen);
  return permitido
    ? {
        "Access-Control-Allow-Origin": permitido,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

function responder(origen: string | null, cuerpo: Record<string, unknown>, status = 200) {
  return Response.json(cuerpo, { status, headers: cabecerasCors(origen) });
}

/** Hash del IP: nunca se guarda el IP en sí. */
function hashConexion(request: Request): string | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (!ip) return null;
  return createHash("sha256")
    .update(`consultas-web:${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cabecerasCors(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origen = request.headers.get("origin");
  // Desde el navegador, solo la web de JMF. (Sin Origin = no es un navegador.)
  if (origen && !origenPermitido(origen)) {
    return responder(origen, { ok: false, error: "Origen no permitido." }, 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return responder(origen, { ok: false, error: "La consulta es demasiado larga." }, 413);
  }

  let datos: unknown;
  try {
    const tipo = request.headers.get("content-type") ?? "";
    datos = tipo.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return responder(origen, { ok: false, error: "No llegaron los datos de la consulta." }, 400);
  }

  const validacion = validarConsultaWeb(datos);
  // A un bot se le contesta "ok" para que no insista, pero no se guarda nada.
  if (!validacion.ok) {
    return "bot" in validacion
      ? responder(origen, { ok: true })
      : responder(origen, { ok: false, error: validacion.error }, 400);
  }
  const consulta = validacion.consulta;

  try {
    const supabase = createAdminClient();
    const ipHash = hashConexion(request);
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [porCelular, porConexion, cliente] = await Promise.all([
      supabase
        .from("consultas_web")
        .select("id", { count: "exact", head: true })
        .eq("telefono_norm", consulta.telefono_norm)
        .gte("created_at", desde),
      ipHash
        ? supabase
            .from("consultas_web")
            .select("id", { count: "exact", head: true })
            .eq("ip_hash", ipHash)
            .gte("created_at", desde)
        : Promise.resolve({ count: 0, error: null }),
      supabase
        .from("clientes")
        .select("id")
        .eq("telefono_norm", consulta.telefono_norm)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    if (porCelular.error) throw new Error(porCelular.error.message);
    if (porConexion.error) throw new Error(porConexion.error.message);

    if ((porCelular.count ?? 0) >= MAX_POR_CELULAR_DIA || (porConexion.count ?? 0) >= MAX_POR_CONEXION_DIA) {
      return responder(
        origen,
        { ok: false, error: "Ya recibimos tus consultas de hoy. Te escribimos por WhatsApp a la brevedad." },
        429
      );
    }

    const { error } = await supabase.from("consultas_web").insert({
      ...consulta,
      cliente_id: (cliente.data?.id as string | undefined) ?? null,
      ip_hash: ipHash,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/consultas");
    revalidatePath("/");
    return responder(origen, { ok: true });
  } catch (e) {
    console.error("consultas web", e);
    return responder(
      origen,
      { ok: false, error: "No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp." },
      500
    );
  }
}
