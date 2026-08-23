"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DatosVehiculoLead, OrigenLead } from "@/lib/types/lead";

export interface EstadoLeadForm {
  error?: string;
  ok?: boolean;
}

/**
 * Horarios de atención — ESPECIFICACION.md §6.4: lunes a viernes 9–18,
 * sábados 10–13. Mismo criterio que Agenda.
 */
function validarHorario(fecha: string, hora: string): string | null {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay();
  const [h, m] = hora.split(":").map(Number);
  const minutos = h * 60 + m;

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

/**
 * Alta de lead. Igual criterio que el turno nuevo de Agenda: cliente
 * "existente" o "nuevo" (crea cliente + vehículo en el mismo paso).
 */
export async function crearLead(
  _prevState: EstadoLeadForm,
  formData: FormData
): Promise<EstadoLeadForm> {
  const origen = String(formData.get("origen") ?? "") as OrigenLead;
  const que_observo = String(formData.get("que_observo") ?? "").trim() || null;
  const servicios_consultados = formData.getAll("servicios_consultados").map(String);
  const modo = String(formData.get("modo") ?? "existente");

  if (origen !== "whatsapp" && origen !== "vino_al_taller") {
    return { error: "Elegí el origen del lead." };
  }

  const supabase = await createClient();
  let cliente_id: string;
  let vehiculo_id: string;
  let marca: string | null;
  let modelo: string | null;
  let patente: string | null;

  if (modo === "nuevo") {
    const nombre_completo = String(formData.get("nombre_completo") ?? "").trim();
    if (!nombre_completo) return { error: "Cargá el nombre del cliente." };
    marca = String(formData.get("marca") ?? "").trim() || null;
    modelo = String(formData.get("modelo") ?? "").trim() || null;
    if (!marca && !modelo) return { error: "Cargá al menos marca o modelo del vehículo." };
    patente = String(formData.get("patente") ?? "").trim().toUpperCase() || null;

    const { data: cliente, error: errorCliente } = await supabase
      .from("clientes")
      .insert({
        nombre_completo,
        telefono: String(formData.get("telefono") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        como_llego: String(formData.get("como_llego") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (errorCliente) return { error: "No se pudo crear el cliente: " + errorCliente.message };

    const { data: vehiculo, error: errorVehiculo } = await supabase
      .from("vehiculos")
      .insert({ cliente_id: cliente.id, marca, modelo, patente })
      .select("id")
      .single();
    if (errorVehiculo) return { error: "No se pudo crear el vehículo: " + errorVehiculo.message };

    cliente_id = cliente.id;
    vehiculo_id = vehiculo.id;
  } else {
    vehiculo_id = String(formData.get("vehiculo_id") ?? "");
    cliente_id = String(formData.get("cliente_id") ?? "");
    if (!cliente_id) return { error: "Elegí un cliente." };
    if (!vehiculo_id) return { error: "Elegí un vehículo." };

    const { data: vehiculo, error: errorVehiculo } = await supabase
      .from("vehiculos")
      .select("marca, modelo, patente")
      .eq("id", vehiculo_id)
      .single();
    if (errorVehiculo) return { error: errorVehiculo.message };
    marca = vehiculo.marca;
    modelo = vehiculo.modelo;
    patente = vehiculo.patente;
  }

  const datos_vehiculo: DatosVehiculoLead = { vehiculo_id, marca, modelo, patente };

  const { error } = await supabase.from("leads").insert({
    cliente_id,
    datos_vehiculo,
    origen,
    que_observo,
    servicios_consultados,
    estado: "pendiente_presupuesto",
  });
  if (error) return { error: "No se pudo cargar el lead: " + error.message };

  revalidatePath("/presupuestos");
  revalidatePath("/clientes");
  return { ok: true };
}

export interface EstadoPresupuestoForm {
  error?: string;
  ok?: boolean;
}

/**
 * Arma el presupuesto: precio por servicio consultado + tiempo estimado.
 * Validez = 7 días desde hoy (§6.6).
 */
export async function guardarPresupuesto(
  leadId: string,
  servicios: string[],
  _prevState: EstadoPresupuestoForm,
  formData: FormData
): Promise<EstadoPresupuestoForm> {
  const tiempo_estimado = String(formData.get("tiempo_estimado") ?? "").trim();
  if (!tiempo_estimado) return { error: "Cargá el tiempo estimado." };

  const items = servicios.map((servicio_id) => ({
    servicio_id,
    precio: Number(formData.get(`precio_${servicio_id}`) ?? 0),
  }));
  if (items.some((i) => !i.precio || i.precio <= 0)) {
    return { error: "Cargá un precio válido para cada servicio." };
  }

  const hoy = new Date();
  const validez = new Date(hoy);
  validez.setDate(validez.getDate() + 7);

  const presupuesto = {
    servicios: items,
    tiempo_estimado,
    validez: validez.toISOString().slice(0, 10),
    fecha: hoy.toISOString().slice(0, 10),
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ presupuesto, estado: "presupuestado" })
    .eq("id", leadId);
  if (error) return { error: "No se pudo guardar el presupuesto: " + error.message };

  revalidatePath("/presupuestos");
  return { ok: true };
}

export interface EstadoAceptarForm {
  error?: string;
  ok?: boolean;
}

/**
 * Marca el lead como aceptado y agenda el turno de servicio (§6.6:
 * "Cuando estado = aceptado → se agenda un Turno de servicio").
 */
export async function aceptarLead(
  leadId: string,
  _prevState: EstadoAceptarForm,
  formData: FormData
): Promise<EstadoAceptarForm> {
  const fecha = String(formData.get("fecha") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  if (!fecha || !hora) return { error: "Cargá fecha y hora del turno." };

  const errorHorario = validarHorario(fecha, hora);
  if (errorHorario) return { error: errorHorario };

  const supabase = await createClient();
  const { data: lead, error: errorLead } = await supabase
    .from("leads")
    .select("cliente_id, datos_vehiculo, servicios_consultados")
    .eq("id", leadId)
    .single();
  if (errorLead) return { error: errorLead.message };

  const datosVehiculo = lead.datos_vehiculo as DatosVehiculoLead;
  const { error: errorTurno } = await supabase.from("turnos").insert({
    cliente_id: lead.cliente_id,
    vehiculo_id: datosVehiculo.vehiculo_id,
    servicios_previstos: lead.servicios_consultados,
    fecha,
    hora,
    estado: "agendado",
  });
  if (errorTurno) return { error: "No se pudo agendar el turno: " + errorTurno.message };

  const { error: errorEstado } = await supabase
    .from("leads")
    .update({ estado: "aceptado" })
    .eq("id", leadId);
  if (errorEstado) return { error: errorEstado.message };

  revalidatePath("/presupuestos");
  revalidatePath("/agenda");
  return { ok: true };
}

export async function marcarPerdido(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ estado: "perdido" }).eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/presupuestos");
}
