"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TurnoInput } from "@/lib/types/turno";

export interface EstadoTurnoForm {
  error?: string;
  ok?: boolean;
}

/**
 * Horarios de atención — ESPECIFICACION.md §6.4:
 * lunes a viernes 9–18, sábados 10–13. Domingo cerrado.
 */
function validarHorario(fecha: string, hora: string): string | null {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay(); // 0=domingo ... 6=sábado
  const minutos = (() => {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
  })();

  if (diaSemana === 0) return "Los domingos el taller está cerrado.";
  if (diaSemana === 6) {
    if (minutos < 10 * 60 || minutos > 13 * 60) {
      return "Los sábados el horario de atención es de 10 a 13.";
    }
    return null;
  }
  if (minutos < 9 * 60 || minutos > 18 * 60) {
    return "De lunes a viernes el horario de atención es de 9 a 18.";
  }
  return null;
}

function leerDatosComunes(
  formData: FormData
): { fecha: string; hora: string; servicios_previstos: string[] } | { error: string } {
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const servicios_previstos = formData.getAll("servicios_previstos").map(String);

  if (!fecha || !hora) return { error: "Cargá fecha y hora." };
  if (servicios_previstos.length === 0) {
    return { error: "Elegí al menos un servicio previsto." };
  }

  const errorHorario = validarHorario(fecha, hora);
  if (errorHorario) return { error: errorHorario };

  return { fecha, hora, servicios_previstos };
}

/**
 * Alta de turno. Soporta dos modos (ver feedback de producto: cargar un
 * turno para un cliente que todavía no existe no debería obligar a pasar
 * antes por Clientes):
 * - "existente": cliente_id y vehiculo_id ya cargados.
 * - "nuevo": crea el cliente y su vehículo en el mismo paso y los conecta
 *   con el turno. Quedan disponibles después en Clientes sin pasos extra.
 */
export async function crearTurno(
  _prevState: EstadoTurnoForm,
  formData: FormData
): Promise<EstadoTurnoForm> {
  const comunes = leerDatosComunes(formData);
  if ("error" in comunes) return { error: comunes.error };

  const supabase = await createClient();
  const modo = String(formData.get("modo") ?? "existente");

  let cliente_id: string;
  let vehiculo_id: string;

  if (modo === "nuevo") {
    const nombre_completo = String(formData.get("nombre_completo") ?? "").trim();
    if (!nombre_completo) return { error: "Cargá el nombre del cliente nuevo." };

    const marca = String(formData.get("marca") ?? "").trim();
    const modelo = String(formData.get("modelo") ?? "").trim();
    if (!marca && !modelo) {
      return { error: "Cargá al menos marca o modelo del vehículo." };
    }

    const { data: cliente, error: errorCliente } = await supabase
      .from("clientes")
      .insert({
        nombre_completo,
        telefono: String(formData.get("telefono") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        como_llego: String(formData.get("como_llego") ?? "").trim() || null,
        notas: String(formData.get("notas") ?? "").trim() || null,
        origen: "detailing",
      })
      .select("id")
      .single();
    if (errorCliente) return { error: "No se pudo crear el cliente: " + errorCliente.message };

    const anioRaw = String(formData.get("anio") ?? "").trim();
    const anio = anioRaw ? Number(anioRaw) : null;
    const { data: vehiculo, error: errorVehiculo } = await supabase
      .from("vehiculos")
      .insert({
        cliente_id: cliente.id,
        marca: marca || null,
        modelo: modelo || null,
        anio: anio && Number.isFinite(anio) ? anio : null,
        patente: String(formData.get("patente") ?? "").trim().toUpperCase() || null,
        color: String(formData.get("color") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (errorVehiculo) {
      return { error: "No se pudo crear el vehículo: " + errorVehiculo.message };
    }

    cliente_id = cliente.id;
    vehiculo_id = vehiculo.id;
  } else {
    cliente_id = String(formData.get("cliente_id") ?? "");
    vehiculo_id = String(formData.get("vehiculo_id") ?? "");
    if (!cliente_id) return { error: "Elegí un cliente." };
    if (!vehiculo_id) return { error: "Elegí un vehículo." };
  }

  const input: TurnoInput = { cliente_id, vehiculo_id, ...comunes };
  const { error } = await supabase.from("turnos").insert({ ...input, estado: "agendado" });

  if (error) return { error: "No se pudo crear el turno: " + error.message };

  revalidatePath("/agenda");
  revalidatePath("/clientes");
  revalidatePath("/autos");
  return { ok: true };
}

/**
 * Marca el turno como ingresado y crea la Orden correspondiente
 * (ESPECIFICACION.md §6.4: "Cuando el auto ingresa → se crea/activa la
 * Orden"). El primer servicio previsto queda como principal (maneja el
 * tablero de fases); el resto entra como adicional sin precio todavía
 * (se carga desde Autos / Órdenes).
 */
export async function marcarIngresado(id: string) {
  const supabase = await createClient();

  const { data: turno, error: errorTurno } = await supabase
    .from("turnos")
    .select("cliente_id, vehiculo_id, servicios_previstos")
    .eq("id", id)
    .single();
  if (errorTurno) throw new Error(errorTurno.message);

  const [principalId, ...adicionalesIds] = turno.servicios_previstos as string[];
  const { data: servicioPrincipal, error: errorServicio } = await supabase
    .from("servicios")
    .select("fases")
    .eq("id", principalId)
    .single();
  if (errorServicio) throw new Error(errorServicio.message);

  const fases = (servicioPrincipal?.fases as string[]) ?? [];
  const hoy = new Date().toISOString().slice(0, 10);

  const { error: errorOrden } = await supabase.from("ordenes").insert({
    cliente_id: turno.cliente_id,
    vehiculo_id: turno.vehiculo_id,
    turno_id: id,
    servicio_principal_id: principalId,
    servicios_adicionales: adicionalesIds.map((servicio_id) => ({
      servicio_id,
      precio: 0,
    })),
    fase_actual: fases[0] ?? null,
    estado: "en_cola",
    fecha_ingreso: hoy,
  });
  if (errorOrden) throw new Error(errorOrden.message);

  const { error: errorEstadoTurno } = await supabase
    .from("turnos")
    .update({ estado: "ingresado" })
    .eq("id", id);
  if (errorEstadoTurno) throw new Error(errorEstadoTurno.message);

  revalidatePath("/agenda");
  revalidatePath("/autos");
}

export async function cancelarTurno(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
  revalidatePath("/autos");
}
