"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DIAS_SEMANA } from "@/lib/types/config";
import type { CategoriasMovimiento, Horarios } from "@/lib/types/config";
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
