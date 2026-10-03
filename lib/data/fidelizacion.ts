import { createClient } from "@/lib/supabase/server";
import { obtenerConfiguracion } from "@/lib/data/config";
import { estadoAviso, premiosAlcanzables } from "@/lib/fidelizacion/reglas";
import type {
  AvisoFidelizacion,
  MovimientoPuntos,
  Premio,
  ResumenFidelizacion,
} from "@/lib/types/fidelizacion";

export async function listarPremios(): Promise<Premio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("premios")
    .select("*")
    .order("puntos", { ascending: true });
  if (error) throw new Error("No se pudieron cargar los premios: " + error.message);
  return data as Premio[];
}

/**
 * Saldo de puntos, total gastado (órdenes cobradas) y estado de aviso de
 * todos los clientes que tienen algo de eso. Un solo viaje por tabla: la
 * base de clientes de JMF es chica.
 */
export async function obtenerResumenesFidelizacion(): Promise<Map<string, ResumenFidelizacion>> {
  const supabase = await createClient();
  const [movimientos, ordenes, avisos, premios, config] = await Promise.all([
    supabase.from("puntos_movimientos").select("cliente_id, puntos"),
    supabase.from("ordenes").select("cliente_id, monto_ars").eq("estado_pago", "cobrado"),
    supabase
      .from("fidelizacion_avisos")
      .select("*")
      .order("created_at", { ascending: false }),
    listarPremios(),
    obtenerConfiguracion(),
  ]);
  if (movimientos.error) throw new Error(movimientos.error.message);
  if (ordenes.error) throw new Error(ordenes.error.message);
  if (avisos.error) throw new Error(avisos.error.message);

  const saldos = new Map<string, number>();
  for (const m of movimientos.data ?? []) {
    saldos.set(m.cliente_id, (saldos.get(m.cliente_id) ?? 0) + (m.puntos as number));
  }
  const gastado = new Map<string, number>();
  for (const o of ordenes.data ?? []) {
    if (!o.cliente_id) continue;
    gastado.set(o.cliente_id, (gastado.get(o.cliente_id) ?? 0) + Number(o.monto_ars ?? 0));
  }
  const ultimoAviso = new Map<string, AvisoFidelizacion>();
  for (const a of (avisos.data ?? []) as AvisoFidelizacion[]) {
    if (!ultimoAviso.has(a.cliente_id)) ultimoAviso.set(a.cliente_id, a);
  }

  const resumenes = new Map<string, ResumenFidelizacion>();
  const ids = new Set([...saldos.keys(), ...gastado.keys(), ...ultimoAviso.keys()]);
  for (const id of ids) {
    const saldo = saldos.get(id) ?? 0;
    const aviso = ultimoAviso.get(id) ?? null;
    resumenes.set(id, {
      saldo,
      total_gastado: gastado.get(id) ?? 0,
      premios_disponibles: premiosAlcanzables(saldo, premios),
      ultimo_aviso: aviso,
      estado_aviso: estadoAviso(saldo, premios, aviso, config.fidelizacion.reaviso_dias),
    });
  }
  return resumenes;
}

export const RESUMEN_VACIO: ResumenFidelizacion = {
  saldo: 0,
  total_gastado: 0,
  premios_disponibles: [],
  ultimo_aviso: null,
  estado_aviso: "sin_premio",
};

/** Todo lo de fidelización de un cliente, para su ficha. */
export async function obtenerFidelizacionCliente(clienteId: string): Promise<{
  resumen: ResumenFidelizacion;
  movimientos: MovimientoPuntos[];
  avisos: AvisoFidelizacion[];
  premios: Premio[];
}> {
  const supabase = await createClient();
  const [movimientos, avisos, ordenes, premios, config] = await Promise.all([
    supabase
      .from("puntos_movimientos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false }),
    supabase
      .from("fidelizacion_avisos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ordenes")
      .select("monto_ars")
      .eq("cliente_id", clienteId)
      .eq("estado_pago", "cobrado"),
    listarPremios(),
    obtenerConfiguracion(),
  ]);
  if (movimientos.error) throw new Error(movimientos.error.message);
  if (avisos.error) throw new Error(avisos.error.message);
  if (ordenes.error) throw new Error(ordenes.error.message);

  const lista = (movimientos.data ?? []) as MovimientoPuntos[];
  const listaAvisos = (avisos.data ?? []) as AvisoFidelizacion[];
  const saldo = lista.reduce((acc, m) => acc + m.puntos, 0);
  const ultimo = listaAvisos[0] ?? null;

  return {
    resumen: {
      saldo,
      total_gastado: (ordenes.data ?? []).reduce((acc, o) => acc + Number(o.monto_ars ?? 0), 0),
      premios_disponibles: premiosAlcanzables(saldo, premios),
      ultimo_aviso: ultimo,
      estado_aviso: estadoAviso(saldo, premios, ultimo, config.fidelizacion.reaviso_dias),
    },
    movimientos: lista,
    avisos: listaAvisos,
    premios,
  };
}
