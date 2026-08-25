"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClienteInput, OrigenCliente, VehiculoInput } from "@/lib/types/cliente";

export interface EstadoFormulario {
  error?: string;
  ok?: boolean;
}

function leerClienteInput(
  formData: FormData
): (ClienteInput & { origen: OrigenCliente }) | { error: string } {
  const nombre_completo = String(formData.get("nombre_completo") ?? "").trim();
  if (!nombre_completo) return { error: "El nombre es obligatorio." };

  const origen = String(formData.get("origen") ?? "");
  if (origen !== "detailing" && origen !== "classmotor") {
    return { error: "Elegí a qué marca pertenece el cliente." };
  }

  return {
    nombre_completo,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    como_llego: String(formData.get("como_llego") ?? "").trim() || null,
    notas: String(formData.get("notas") ?? "").trim() || null,
    origen,
  };
}

export async function crearCliente(
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerClienteInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert(input)
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el cliente: " + error.message };

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function actualizarCliente(
  id: string,
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerClienteInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update(input).eq("id", id);

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { ok: true };
}

export async function eliminarCliente(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error) {
    // 23503 = foreign key violation: tiene turnos/órdenes/leads asociados.
    if (error.code === "23503") {
      return {
        error:
          "No se puede eliminar: este cliente tiene turnos, órdenes o leads asociados.",
      };
    }
    return { error: "No se pudo eliminar: " + error.message };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

function leerVehiculoInput(formData: FormData): VehiculoInput | { error: string } {
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  if (!marca && !modelo) {
    return { error: "Cargá al menos marca o modelo del vehículo." };
  }

  const anioRaw = String(formData.get("anio") ?? "").trim();
  const anio = anioRaw ? Number(anioRaw) : null;

  return {
    marca: marca || null,
    modelo: modelo || null,
    anio: anio && Number.isFinite(anio) ? anio : null,
    patente: String(formData.get("patente") ?? "").trim().toUpperCase() || null,
    color: String(formData.get("color") ?? "").trim() || null,
    detalles: String(formData.get("detalles") ?? "").trim() || null,
  };
}

export async function crearVehiculo(
  clienteId: string,
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerVehiculoInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehiculos")
    .insert({ ...input, cliente_id: clienteId });

  if (error) return { error: "No se pudo agregar el vehículo: " + error.message };

  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function actualizarVehiculo(
  clienteId: string,
  vehiculoId: string,
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const input = leerVehiculoInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehiculos")
    .update(input)
    .eq("id", vehiculoId);

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function eliminarVehiculo(clienteId: string, vehiculoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehiculos").delete().eq("id", vehiculoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${clienteId}`);
}

/**
 * Carga un servicio ya hecho al historial de un cliente/vehículo que se
 * está migrando desde afuera (Excel, WhatsApp, libreta). Crea la Orden
 * directamente, sin turno (turno_id null) y ya entregada.
 */
export async function registrarServicioHistorico(
  clienteId: string,
  vehiculoId: string,
  _prevState: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const servicio_principal_id = String(formData.get("servicio_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "").trim();
  const precioRaw = String(formData.get("precio_total") ?? "").trim();

  if (!servicio_principal_id) return { error: "Elegí el servicio realizado." };
  if (!fecha) return { error: "Cargá la fecha en que se hizo." };

  const precio_total = precioRaw ? Number(precioRaw) : null;
  if (precioRaw && (!Number.isFinite(precio_total) || precio_total! < 0)) {
    return { error: "El precio no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ordenes").insert({
    cliente_id: clienteId,
    vehiculo_id: vehiculoId,
    turno_id: null,
    servicio_principal_id,
    servicios_adicionales: [],
    precio_total,
    estado: "entregado",
    fecha_ingreso: fecha,
    fecha_entrega: fecha,
  });

  if (error) return { error: "No se pudo cargar el historial: " + error.message };

  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}
