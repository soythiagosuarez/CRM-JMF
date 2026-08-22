"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ORDEN_ESTADOS, calcularGanancia } from "@/lib/types/classmotor";
import type { AutoClassmotor, CostoExtra, EstadoAutoClassmotor, TipoAutoClassmotor } from "@/lib/types/classmotor";

export interface EstadoAutoForm {
  error?: string;
  ok?: boolean;
}

function leerInput(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "") as TipoAutoClassmotor;
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  if (tipo !== "compra_venta" && tipo !== "preventa_venta") {
    return { error: "Elegí el tipo de operación." };
  }
  if (!marca && !modelo) return { error: "Cargá al menos marca o modelo." };

  const numeroOpcional = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  return {
    tipo,
    marca: marca || null,
    modelo: modelo || null,
    anio: numeroOpcional(formData.get("anio")),
    km: numeroOpcional(formData.get("km")),
    patente: String(formData.get("patente") ?? "").trim().toUpperCase() || null,
    color: String(formData.get("color") ?? "").trim() || null,
    detalles: String(formData.get("detalles") ?? "").trim() || null,
    precio_base: numeroOpcional(formData.get("precio_base")),
    precio_venta: numeroOpcional(formData.get("precio_venta")),
  };
}

export async function crearAutoClassmotor(
  _prevState: EstadoAutoForm,
  formData: FormData
): Promise<EstadoAutoForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("autos_classmotor").insert({
    ...input,
    estado: "ingresa",
    fecha_ingreso: hoy,
    costos_extra: [],
  });

  if (error) return { error: "No se pudo cargar el auto: " + error.message };

  revalidatePath("/classmotor");
  return { ok: true };
}

export async function actualizarAutoClassmotor(
  autoId: string,
  _prevState: EstadoAutoForm,
  formData: FormData
): Promise<EstadoAutoForm> {
  const input = leerInput(formData);
  if ("error" in input) return { error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from("autos_classmotor").update(input).eq("id", autoId);
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/classmotor");
  return { ok: true };
}

export interface EstadoCostoForm {
  error?: string;
  ok?: boolean;
}

/**
 * Agrega un costo extra a la ficha Y genera el Movimiento de egreso
 * correspondiente (§6.8: "los costos se registran cuando ocurren").
 */
export async function agregarCostoExtra(
  autoId: string,
  _prevState: EstadoCostoForm,
  formData: FormData
): Promise<EstadoCostoForm> {
  const concepto = String(formData.get("concepto") ?? "").trim();
  const monto = Number(formData.get("monto"));
  if (!concepto) return { error: "Elegí el concepto." };
  if (!monto || monto <= 0) return { error: "Cargá un monto válido." };

  const supabase = await createClient();
  const { data: auto, error: errorGet } = await supabase
    .from("autos_classmotor")
    .select("costos_extra")
    .eq("id", autoId)
    .single();
  if (errorGet) return { error: errorGet.message };

  const costos = [...((auto.costos_extra as CostoExtra[]) ?? []), { concepto, monto }];
  const { error: errorUpdate } = await supabase
    .from("autos_classmotor")
    .update({ costos_extra: costos })
    .eq("id", autoId);
  if (errorUpdate) return { error: "No se pudo guardar el costo: " + errorUpdate.message };

  const hoy = new Date().toISOString().slice(0, 10);
  const { error: errorMovimiento } = await supabase.from("movimientos").insert({
    tipo: "egreso",
    marca: "classmotor",
    categoria: concepto,
    monto,
    moneda_original: "ARS",
    monto_ars: monto,
    fecha: hoy,
    origen: "classmotor",
    ref_origen: autoId,
    descripcion: `Costo extra: ${concepto}`,
  });
  if (errorMovimiento) {
    return { error: "El costo se guardó pero falló el movimiento: " + errorMovimiento.message };
  }

  revalidatePath("/classmotor");
  revalidatePath("/finanzas");
  return { ok: true };
}

/**
 * Avanza el estado de la ficha, solo hacia adelante (mismo criterio que
 * Autos/Órdenes). Al llegar a "vendido" genera el Movimiento de ingreso
 * con la ganancia (§6.8: la compra/costos no ensucian el mes, solo la
 * ganancia entra al vender).
 */
export async function moverEstadoClassmotor(autoId: string, nuevoEstado: EstadoAutoClassmotor) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("autos_classmotor")
    .select("*")
    .eq("id", autoId)
    .single();
  if (error) throw new Error(error.message);

  const auto = data as AutoClassmotor;
  const indiceActual = ORDEN_ESTADOS.indexOf(auto.estado);
  const indiceNuevo = ORDEN_ESTADOS.indexOf(nuevoEstado);
  if (indiceNuevo <= indiceActual) return; // solo hacia adelante

  const hoy = new Date().toISOString().slice(0, 10);
  const actualizacion: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "vendido") actualizacion.fecha_venta = hoy;

  const { error: errorUpdate } = await supabase
    .from("autos_classmotor")
    .update(actualizacion)
    .eq("id", autoId);
  if (errorUpdate) throw new Error(errorUpdate.message);

  if (nuevoEstado === "vendido") {
    const ganancia = calcularGanancia(auto);
    const { error: errorMovimiento } = await supabase.from("movimientos").insert({
      tipo: "ingreso",
      marca: "classmotor",
      categoria: "Ganancia por auto vendido",
      monto: ganancia,
      moneda_original: "ARS",
      monto_ars: ganancia,
      fecha: hoy,
      origen: "classmotor",
      ref_origen: autoId,
      descripcion: [auto.marca, auto.modelo].filter(Boolean).join(" ") || "Auto Classmotor",
    });
    if (errorMovimiento) throw new Error(errorMovimiento.message);
    revalidatePath("/finanzas");
  }

  revalidatePath("/classmotor");
}
