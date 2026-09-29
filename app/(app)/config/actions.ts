"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIAS_SEMANA, DIA_LABEL } from "@/lib/types/config";
import type {
  CategoriasMovimiento,
  ConfigReservas,
  Franja,
  FranjasPorDia,
  Horarios,
} from "@/lib/types/config";
import type { MarcaMovimiento, TipoMovimiento } from "@/lib/types/movimiento";
import { MARCA_LABEL } from "@/lib/types/movimiento";

export interface EstadoConfigForm {
  error?: string;
  ok?: boolean;
}

function revalidarDependientes() {
  // Horarios y categorías se usan fuera de /config: Agenda valida
  // horarios, Finanzas/Autos arman los selects de categoría con ellos.
  revalidatePath("/config");
  revalidatePath("/agenda");
  revalidatePath("/autos");
  revalidatePath("/finanzas");
}

export async function actualizarHorarios(
  _prevState: EstadoConfigForm,
  formData: FormData
): Promise<EstadoConfigForm> {
  const horarios: Horarios = {} as Horarios;

  for (const dia of DIAS_SEMANA) {
    const cerrado = formData.get(`${dia}_cerrado`) === "on";
    const desde = String(formData.get(`${dia}_desde`) ?? "").trim();
    const hasta = String(formData.get(`${dia}_hasta`) ?? "").trim();

    if (!cerrado) {
      if (!desde || !hasta) return { error: `Cargá el horario del ${dia}.` };
      if (desde >= hasta) {
        return { error: `El horario del ${dia} tiene que empezar antes de terminar.` };
      }
    }

    horarios[dia] = { cerrado, desde: desde || "09:00", hasta: hasta || "18:00" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ horarios, updated_at: new Date().toISOString() })
    .eq("id", "global");

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidarDependientes();
  return { ok: true };
}

/** Parsea una lista separada por comas, recorta espacios y descarta vacíos. */
function parsearLista(valor: FormDataEntryValue | null): string[] {
  return String(valor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function actualizarCategorias(
  _prevState: EstadoConfigForm,
  formData: FormData
): Promise<EstadoConfigForm> {
  const marcas = Object.keys(MARCA_LABEL) as MarcaMovimiento[];
  const tipos: TipoMovimiento[] = ["ingreso", "egreso"];

  const categorias_movimiento = {
    ingreso: {} as Record<MarcaMovimiento, string[]>,
    egreso: {} as Record<MarcaMovimiento, string[]>,
  } as CategoriasMovimiento;

  for (const tipo of tipos) {
    for (const marca of marcas) {
      categorias_movimiento[tipo][marca] = parsearLista(formData.get(`${tipo}_${marca}`));
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ categorias_movimiento, updated_at: new Date().toISOString() })
    .eq("id", "global");

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidarDependientes();
  return { ok: true };
}

const REGEX_FRANJA = /^(\d{1,2}):(\d{2})\s*(?:-|–|a)\s*(\d{1,2}):(\d{2})$/;

/** "9:00-13:00, 14:00-18:00" → [{desde:"09:00",hasta:"13:00"}, ...] */
function parsearFranjas(texto: string): Franja[] | { error: string } {
  const franjas: Franja[] = [];
  for (const parte of texto.split(",").map((p) => p.trim()).filter(Boolean)) {
    const m = parte.match(REGEX_FRANJA);
    if (!m) return { error: `No entiendo la franja "${parte}". Escribila como 9:00-13:00.` };
    const desde = `${m[1].padStart(2, "0")}:${m[2]}`;
    const hasta = `${m[3].padStart(2, "0")}:${m[4]}`;
    if (desde >= hasta) return { error: `La franja "${parte}" tiene que empezar antes de terminar.` };
    franjas.push({ desde, hasta });
  }
  return franjas.sort((a, b) => a.desde.localeCompare(b.desde));
}

/** Ajustes de la agenda online (/reservar). */
export async function actualizarConfigReservas(
  _prevState: EstadoConfigForm,
  formData: FormData
): Promise<EstadoConfigForm> {
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (whatsapp.length < 11 || whatsapp.length > 15) {
    return { error: "Cargá el WhatsApp con código de país, ej. 54 9 11 6972 8834." };
  }
  const direccion = String(formData.get("direccion") ?? "").trim();
  if (!direccion) return { error: "Cargá la dirección del taller." };
  const indicaciones = String(formData.get("indicaciones") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const franjas = {} as FranjasPorDia;
  for (const dia of DIAS_SEMANA) {
    const r = parsearFranjas(String(formData.get(`franjas_${dia}`) ?? ""));
    if ("error" in r) return { error: `${DIA_LABEL[dia]}: ${r.error}` };
    franjas[dia] = r;
  }

  const numeros: Record<string, number> = {};
  const limites: [string, number, number, string][] = [
    ["capacidad_taller", 1, 50, "Autos en el taller"],
    ["anticipacion_min_dias", 0, 30, "Anticipación mínima"],
    ["anticipacion_max_dias", 1, 365, "Hasta cuántos días adelante"],
    ["max_pendientes_por_celular", 1, 20, "Reservas pendientes por celular"],
  ];
  for (const [campo, min, max, etiqueta] of limites) {
    const n = Number(formData.get(campo));
    if (!Number.isInteger(n) || n < min || n > max) {
      return { error: `${etiqueta}: poné un número entre ${min} y ${max}.` };
    }
    numeros[campo] = n;
  }
  if (numeros.anticipacion_min_dias > numeros.anticipacion_max_dias) {
    return { error: "La anticipación mínima no puede ser mayor que el máximo de días." };
  }

  const reservas: ConfigReservas = {
    whatsapp,
    direccion,
    indicaciones,
    franjas,
    capacidad_taller: numeros.capacidad_taller,
    anticipacion_min_dias: numeros.anticipacion_min_dias,
    anticipacion_max_dias: numeros.anticipacion_max_dias,
    max_pendientes_por_celular: numeros.max_pendientes_por_celular,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({ reservas, updated_at: new Date().toISOString() })
    .eq("id", "global");
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/config");
  revalidatePath("/agenda");
  revalidatePath("/reservar");
  return { ok: true };
}

/** Bloquea un día entero o una franja (vacaciones, feriado, taller lleno). */
export async function crearBloqueo(
  _prevState: EstadoConfigForm,
  formData: FormData
): Promise<EstadoConfigForm> {
  const fecha = String(formData.get("fecha") ?? "").trim();
  const franja = String(formData.get("franja_desde") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim().slice(0, 120) || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Elegí la fecha a bloquear." };
  if (franja && !/^\d{2}:\d{2}$/.test(franja)) return { error: "La franja no es válida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agenda_bloqueos")
    .insert({ fecha, franja_desde: franja || null, motivo });
  if (error) return { error: "No se pudo bloquear: " + error.message };

  revalidatePath("/config");
  revalidatePath("/reservar");
  return { ok: true };
}

export async function eliminarBloqueo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_bloqueos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/config");
  revalidatePath("/reservar");
}
