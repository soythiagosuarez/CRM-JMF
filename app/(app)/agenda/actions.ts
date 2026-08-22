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

function leerInput(formData: FormData): TurnoInput | { error: string } {
  const cliente_id = String(formData.get("cliente_id") ?? "");
  const vehiculo_id = String(formData.get("vehiculo_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const servicios_previstos = formData.getAll("servicios_previstos").map(String);

  if (!cliente_id) return { error: "Elegí un cliente." };
  if (!vehiculo_id) return { error: "Elegí un vehículo." };
  if (!fecha || !hora) return { error: "Cargá fecha y hora." };
  if (servicios_previstos.length === 0) {
    return { error: "Elegí al menos un servicio previsto." };
  }

  const errorHorario = validarHorario(fecha, hora);
  if (errorHorario) return { error: errorHorario };

  return { cliente_id, vehiculo_id, fecha, hora, servicios_previstos };
}

export async function crearTurno(
  _prevState: EstadoTurnoForm,
  formData: FormData
): Promise<EstadoTurnoForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("turnos").insert({ ...input, estado: "agendado" });

  if (error) return { error: "No se pudo crear el turno: " + error.message };

  revalidatePath("/agenda");
  return { ok: true };
}

export async function marcarIngresado(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turnos")
    .update({ estado: "ingresado" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  // TODO: cuando exista el módulo Autos / Órdenes, acá se crea la Orden
  // correspondiente (ver ESPECIFICACION.md §6.4 y §6.5).
  revalidatePath("/agenda");
}

export async function cancelarTurno(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
}
