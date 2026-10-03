"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { MOTIVO_PUNTOS_LABEL, type ConfigFidelizacion, type MotivoPuntos } from "@/lib/types/config";

/**
 * Acciones de fidelización (propuesta 2): puntos, premios, canjes y
 * avisos por WhatsApp. Todo lo maneja JMF desde el CRM.
 */

export interface EstadoFidelizacionForm {
  error?: string;
  ok?: boolean;
}

async function saldoCliente(supabase: SupabaseClient, clienteId: string): Promise<number> {
  const { data, error } = await supabase.from("puntos_movimientos").select("puntos").eq("cliente_id", clienteId);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((acc, m) => acc + (m.puntos as number), 0);
}

function revalidarCliente(clienteId: string) {
  revalidatePath("/");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
}

/** Se llama al tocar "Avisar por WhatsApp": deja registrado el aviso. */
export async function registrarAviso(clienteId: string) {
  const supabase = await createClient();
  const saldo = await saldoCliente(supabase, clienteId);
  const { error } = await supabase
    .from("fidelizacion_avisos")
    .insert({ cliente_id: clienteId, saldo_al_avisar: saldo });
  if (error) throw new Error(error.message);
  revalidarCliente(clienteId);
}

/** Respuesta del cliente que no implica canje (respuesta 12.3). */
export async function responderAviso(avisoId: string, respuesta: "guarda" | "no_interesa") {
  if (respuesta !== "guarda" && respuesta !== "no_interesa") throw new Error("Respuesta no válida.");
  const supabase = await createClient();
  const { data: aviso, error } = await supabase
    .from("fidelizacion_avisos")
    .select("cliente_id, respuesta")
    .eq("id", avisoId)
    .single();
  if (error) throw new Error(error.message);
  if (aviso.respuesta) return;

  const saldo = await saldoCliente(supabase, aviso.cliente_id);
  const { error: errorUpdate } = await supabase
    .from("fidelizacion_avisos")
    .update({ respuesta, respondido_en: new Date().toISOString(), saldo_post: saldo })
    .eq("id", avisoId);
  if (errorUpdate) throw new Error(errorUpdate.message);
  revalidarCliente(aviso.cliente_id);
}

/**
 * Canje de un premio: descuenta los puntos y el premio queda "pendiente
 * de usar" hasta que se aplica en un turno (los premios no vencen,
 * respuesta 10.5). Si había un aviso sin responder, queda como aceptado.
 */
export async function canjearPremio(clienteId: string, premioId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: premio, error } = await supabase
    .from("premios")
    .select("id, nombre, puntos, activo")
    .eq("id", premioId)
    .single();
  if (error || !premio?.activo) return { error: "Ese premio no está disponible." };

  const saldo = await saldoCliente(supabase, clienteId);
  if (saldo < premio.puntos) {
    return { error: `Le faltan ${premio.puntos - saldo} puntos para ese premio.` };
  }

  const { error: errorCanje } = await supabase.from("puntos_movimientos").insert({
    cliente_id: clienteId,
    puntos: -premio.puntos,
    tipo: "canje",
    motivo: `Canje: ${premio.nombre}`,
    premio_id: premio.id,
    premio_nombre: premio.nombre,
    canje_estado: "pendiente",
  });
  if (errorCanje) return { error: "No se pudo registrar el canje: " + errorCanje.message };

  const ahora = new Date().toISOString();
  const saldoPost = saldo - premio.puntos;
  const { data: pendiente } = await supabase
    .from("fidelizacion_avisos")
    .select("id")
    .eq("cliente_id", clienteId)
    .is("respuesta", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Queda registrado como respuesta "aceptó": desde este saldo se cuenta
  // cuándo vuelve a llegar a un premio.
  const { error: errorAviso } = pendiente
    ? await supabase
        .from("fidelizacion_avisos")
        .update({ respuesta: "acepta", respondido_en: ahora, saldo_post: saldoPost })
        .eq("id", pendiente.id)
    : await supabase.from("fidelizacion_avisos").insert({
        cliente_id: clienteId,
        saldo_al_avisar: saldo,
        respuesta: "acepta",
        respondido_en: ahora,
        saldo_post: saldoPost,
      });
  if (errorAviso) return { error: "El canje se registró, pero no se pudo actualizar el aviso: " + errorAviso.message };

  revalidarCliente(clienteId);
  return {};
}

export async function marcarCanjeUsado(movimientoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("puntos_movimientos")
    .update({ canje_estado: "usado", canje_usado_en: new Date().toISOString() })
    .eq("id", movimientoId)
    .eq("tipo", "canje")
    .select("cliente_id")
    .single();
  if (error) throw new Error(error.message);
  revalidarCliente(data.cliente_id);
}

/** Sumar o restar puntos a mano, siempre con motivo (respuesta 9.9). */
export async function ajustarPuntos(
  clienteId: string,
  _prev: EstadoFidelizacionForm,
  formData: FormData
): Promise<EstadoFidelizacionForm> {
  const motivo = String(formData.get("motivo") ?? "") as MotivoPuntos;
  if (!(motivo in MOTIVO_PUNTOS_LABEL)) return { error: "Elegí el motivo." };
  const puntos = Number(formData.get("puntos"));
  if (!Number.isInteger(puntos) || puntos === 0 || Math.abs(puntos) > 100000) {
    return { error: "Cargá cuántos puntos (usá un número negativo para restar)." };
  }
  const detalle = String(formData.get("detalle") ?? "").trim().slice(0, 200);
  if (motivo === "ajuste" && !detalle) return { error: "Contá el motivo del ajuste en el detalle." };

  const supabase = await createClient();
  if (puntos < 0) {
    const saldo = await saldoCliente(supabase, clienteId);
    if (saldo + puntos < 0) return { error: `Solo tiene ${saldo} puntos: no se le pueden restar ${-puntos}.` };
  }

  const { error } = await supabase.from("puntos_movimientos").insert({
    cliente_id: clienteId,
    puntos,
    tipo: "manual",
    motivo: `${MOTIVO_PUNTOS_LABEL[motivo]}${detalle ? ` · ${detalle}` : ""}`,
  });
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidarCliente(clienteId);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Catálogo de premios (editable por Joaco, respuesta 10.1)
// ---------------------------------------------------------------------

function leerPremio(formData: FormData): { nombre: string; puntos: number; condiciones: string | null } | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 120);
  const puntos = Number(formData.get("puntos"));
  if (!nombre) return { error: "Poné el nombre del premio." };
  if (!Number.isInteger(puntos) || puntos <= 0) return { error: "Los puntos tienen que ser un número mayor a 0." };
  return { nombre, puntos, condiciones: String(formData.get("condiciones") ?? "").trim().slice(0, 300) || null };
}

function revalidarPremios() {
  revalidatePath("/clientes/fidelizacion");
  revalidatePath("/clientes");
  revalidatePath("/");
}

export async function crearPremio(
  _prev: EstadoFidelizacionForm,
  formData: FormData
): Promise<EstadoFidelizacionForm> {
  const input = leerPremio(formData);
  if ("error" in input) return { error: input.error };
  const supabase = await createClient();
  const { error } = await supabase.from("premios").insert(input);
  if (error) return { error: "No se pudo crear el premio: " + error.message };
  revalidarPremios();
  return { ok: true };
}

export async function actualizarPremio(
  id: string,
  _prev: EstadoFidelizacionForm,
  formData: FormData
): Promise<EstadoFidelizacionForm> {
  const input = leerPremio(formData);
  if ("error" in input) return { error: input.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("premios")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar: " + error.message };
  revalidarPremios();
  return { ok: true };
}

export async function cambiarActivoPremio(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("premios")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidarPremios();
}

/** Reglas: pesos por punto, días para re-avisar y puntos sugeridos por motivo. */
export async function actualizarConfigFidelizacion(
  _prev: EstadoFidelizacionForm,
  formData: FormData
): Promise<EstadoFidelizacionForm> {
  const pesos = Number(formData.get("pesos_por_punto"));
  const reaviso = Number(formData.get("reaviso_dias"));
  if (!Number.isFinite(pesos) || pesos < 1) return { error: "Cargá cada cuántos pesos se suma 1 punto." };
  if (!Number.isInteger(reaviso) || reaviso < 1 || reaviso > 365) {
    return { error: "Los días para volver a avisar tienen que estar entre 1 y 365." };
  }

  const puntos_por_motivo: ConfigFidelizacion["puntos_por_motivo"] = {};
  for (const motivo of Object.keys(MOTIVO_PUNTOS_LABEL) as MotivoPuntos[]) {
    const crudo = String(formData.get(`motivo_${motivo}`) ?? "").trim();
    if (!crudo) continue;
    const n = Number(crudo);
    if (!Number.isInteger(n) || n <= 0) {
      return { error: `${MOTIVO_PUNTOS_LABEL[motivo]}: poné un número entero mayor a 0 o dejalo vacío.` };
    }
    puntos_por_motivo[motivo] = n;
  }

  const fidelizacion: ConfigFidelizacion = { pesos_por_punto: pesos, reaviso_dias: reaviso, puntos_por_motivo };
  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ fidelizacion, updated_at: new Date().toISOString() })
    .eq("id", "global");
  if (error) return { error: "No se pudo guardar: " + error.message };
  revalidarPremios();
  return { ok: true };
}
