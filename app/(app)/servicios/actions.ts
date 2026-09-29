"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CategoriaFidelizacion,
  MonedaServicio,
  ReservaOnline,
  ServicioInput,
  UnidadDuracion,
  VarianteServicio,
} from "@/lib/types/servicio";

export interface EstadoServicioForm {
  error?: string;
  ok?: boolean;
}

function leerInput(formData: FormData): ServicioInput | { error: string } {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const fasesRaw = String(formData.get("fases") ?? "");
  const fases = fasesRaw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  if (fases.length === 0) {
    return { error: "Cargá al menos una fase (una por línea, en orden)." };
  }

  const numeroOpcional = (valor: FormDataEntryValue | null) => {
    const s = String(valor ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const reservaRaw = String(formData.get("reserva_online") ?? "no");
  const reserva_online: ReservaOnline =
    reservaRaw === "si" || reservaRaw === "consulta" ? reservaRaw : "no";
  const moneda: MonedaServicio = formData.get("moneda") === "USD" ? "USD" : "ARS";
  const unidadRaw = String(formData.get("duracion_unidad") ?? "");
  const duracion_unidad: UnidadDuracion | null =
    unidadRaw === "horas" || unidadRaw === "dias" ? unidadRaw : null;
  const categoria_fidelizacion: CategoriaFidelizacion =
    formData.get("categoria_fidelizacion") === "premium" ? "premium" : "basico";

  // Variantes: llegan como filas paralelas (variante_nombre[], variante_precio[], ...).
  const nombres = formData.getAll("variante_nombre").map((v) => String(v).trim());
  const precios = formData.getAll("variante_precio");
  const hastas = formData.getAll("variante_precio_hasta");
  const unidades = formData.getAll("variante_unidad");
  const duraciones = formData.getAll("variante_duracion_valor");
  const unidadesDuracion = formData.getAll("variante_duracion_unidad");
  const variantes: VarianteServicio[] = [];
  for (let i = 0; i < nombres.length; i++) {
    if (!nombres[i]) continue;
    const precio = numeroOpcional(precios[i] ?? null);
    if (precio == null || precio < 0) {
      return { error: `Cargá el precio de la opción "${nombres[i]}".` };
    }
    const duracion = numeroOpcional(duraciones[i] ?? null);
    const unidadDuracion = String(unidadesDuracion[i] ?? "");
    variantes.push({
      nombre: nombres[i],
      precio,
      precio_hasta: numeroOpcional(hastas[i] ?? null),
      unidad: String(unidades[i] ?? "").trim() || null,
      duracion_valor: duracion && duracion > 0 ? duracion : null,
      duracion_unidad:
        duracion && duracion > 0 ? (unidadDuracion === "horas" ? "horas" : "dias") : null,
    });
  }

  const duracion_valor = numeroOpcional(formData.get("duracion_valor"));
  if (reserva_online !== "no" && !duracion_valor) {
    return { error: "Para ofrecerlo en la agenda online, cargá cuánto dura el servicio." };
  }
  const precio_referencia = numeroOpcional(formData.get("precio_referencia"));
  if (reserva_online !== "no" && variantes.length === 0 && precio_referencia == null) {
    return { error: "Para ofrecerlo en la agenda online, cargá un precio (o opciones con precio)." };
  }

  const limiteOpcional = (valor: FormDataEntryValue | null) => {
    const n = numeroOpcional(valor);
    return n != null && n > 0 ? Math.floor(n) : null;
  };

  return {
    nombre,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    tiempo_estimado: String(formData.get("tiempo_estimado") ?? "").trim() || null,
    puerta_a_puerta: formData.get("puerta_a_puerta") === "on",
    fases,
    precio_referencia:
      variantes.length > 0 ? Math.min(...variantes.map((v) => v.precio)) : precio_referencia,
    precio_hasta:
      variantes.length > 0
        ? Math.max(...variantes.map((v) => v.precio_hasta ?? v.precio))
        : numeroOpcional(formData.get("precio_hasta")),
    mantenimiento_intervalo_meses: numeroOpcional(
      formData.get("mantenimiento_intervalo_meses")
    ),
    renovacion_meses: numeroOpcional(formData.get("renovacion_meses")),
    reserva_online,
    moneda,
    variantes,
    duracion_valor: duracion_valor && duracion_valor > 0 ? duracion_valor : null,
    duracion_unidad: duracion_valor ? (duracion_unidad ?? "dias") : null,
    limite_dia: limiteOpcional(formData.get("limite_dia")),
    limite_semana: limiteOpcional(formData.get("limite_semana")),
    categoria_fidelizacion,
  };
}

export async function crearServicio(
  _prevState: EstadoServicioForm,
  formData: FormData
): Promise<EstadoServicioForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").insert(input);

  if (error) return { error: "No se pudo crear el servicio: " + error.message };

  revalidatePath("/servicios");
  revalidatePath("/reservar");
  return { ok: true };
}

export async function actualizarServicio(
  id: string,
  _prevState: EstadoServicioForm,
  formData: FormData
): Promise<EstadoServicioForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("servicios").update(input).eq("id", id);

  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/servicios");
  revalidatePath("/reservar");
  return { ok: true };
}

export async function cambiarActivoServicio(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("servicios")
    .update({ activo })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/servicios");
}
