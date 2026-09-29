"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerContextoAgenda } from "@/lib/reservas/datos";
import { jornadasServicio, validarFranja } from "@/lib/reservas/disponibilidad";
import { esFechaISO } from "@/lib/reservas/fechas";
import { nombreItem, precioItem, textoPrecio, textoPrecioTotal } from "@/lib/reservas/precios";
import { enmascararPatente, normalizarPatente, normalizarTelefono } from "@/lib/reservas/vehiculos";
import {
  CANAL_LABEL,
  type CanalReserva,
  type ItemReserva,
  type ReservaConfirmada,
  type ReservaInput,
  type ServicioPublico,
  type VehiculoEnmascarado,
  type VehiculoReservaNuevo,
} from "@/lib/types/reserva";

/**
 * Acciones de la agenda pública (/reservar). No hay login: todo se
 * valida acá y se escribe con la service role. Nunca devolver filas
 * crudas — solo lo que la pantalla necesita.
 */

const MENSAJE_ERROR_GENERAL =
  "No pudimos completar la reserva. Probá de nuevo en un rato o escribinos por WhatsApp.";

const TAMANOS = ["chico", "mediano", "suv", "pickup", "grande"] as const;
const CONDICIONES = ["0km", "usado"] as const;

interface ClienteEncontrado {
  id: string;
  nombre_completo: string;
  email: string | null;
  notas: string | null;
  acepta_promos: boolean;
}

async function buscarClientePorTelefono(
  supabase: SupabaseClient,
  telefonoNorm: string
): Promise<ClienteEncontrado | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre_completo, email, notas, acepta_promos")
    .eq("telefono_norm", telefonoNorm)
    .eq("origen", "detailing")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ClienteEncontrado | null;
}

function validarTelefono(telefono: unknown): string | null {
  const norm = normalizarTelefono(String(telefono ?? ""));
  return norm.length === 10 ? norm : null;
}

const ERROR_TELEFONO =
  "Revisá el celular: poné el código de área sin el 0 y el número sin el 15 (ej. 11 6972 8834).";

export async function buscarClienteReserva(
  telefono: string
): Promise<{ encontrado: boolean; vehiculos: VehiculoEnmascarado[] } | { error: string }> {
  const norm = validarTelefono(telefono);
  if (!norm) return { error: ERROR_TELEFONO };

  try {
    const supabase = createAdminClient();
    const cliente = await buscarClientePorTelefono(supabase, norm);
    if (!cliente) return { encontrado: false, vehiculos: [] };

    const { data: vehiculos, error } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, patente")
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return {
      encontrado: true,
      vehiculos: (vehiculos ?? []).map((v) => ({
        id: v.id as string,
        descripcion: [v.marca, v.modelo].filter(Boolean).join(" ") || "Auto",
        patente: enmascararPatente(v.patente as string | null),
      })),
    };
  } catch (e) {
    console.error("buscarClienteReserva", e);
    return { error: "No pudimos buscar tus datos. Probá de nuevo en un rato." };
  }
}

function texto(valor: unknown, max: number): string {
  return String(valor ?? "").trim().slice(0, max);
}

/** Valida y ordena los servicios elegidos: el más largo va primero,
 * porque el primero es el que maneja el tablero de fases en el CRM. */
function validarItems(
  crudos: unknown,
  reservables: ServicioPublico[]
): { items: ItemReserva[] } | { error: string } {
  if (!Array.isArray(crudos) || crudos.length === 0) return { error: "Elegí al menos un servicio." };
  if (crudos.length > 6) return { error: "Elegí hasta 6 servicios por turno." };

  const items: ItemReserva[] = [];
  for (const crudo of crudos) {
    const servicio = reservables.find((s) => s.id === crudo?.servicio_id);
    if (!servicio) return { error: "Uno de los servicios ya no está disponible. Volvé a elegirlos." };
    if (items.some((i) => i.servicio_id === servicio.id)) continue;

    let variante: number | null = null;
    if (servicio.variantes.length > 0) {
      const v = Number(crudo.variante);
      if (!Number.isInteger(v) || v < 0 || v >= servicio.variantes.length) {
        return { error: `Elegí una opción de ${servicio.nombre}.` };
      }
      variante = v;
    }
    const porUnidad = variante != null && !!servicio.variantes[variante].unidad;
    const cantidad = porUnidad ? Math.min(8, Math.max(1, Math.floor(Number(crudo.cantidad) || 1))) : 1;
    items.push({ servicio_id: servicio.id, variante, cantidad });
  }

  items.sort((a, b) => {
    const sa = reservables.find((s) => s.id === a.servicio_id)!;
    const sb = reservables.find((s) => s.id === b.servicio_id)!;
    return jornadasServicio(sb, b.variante) - jornadasServicio(sa, a.variante);
  });
  return { items };
}

function validarVehiculoNuevo(
  crudo: ReservaInput["vehiculo"]
): { vehiculo: VehiculoReservaNuevo } | { error: string } {
  if (!crudo) return { error: "Completá los datos de tu auto." };
  const marca = texto(crudo.marca, 40);
  const modelo = texto(crudo.modelo, 60);
  const color = texto(crudo.color, 30);
  const patente = normalizarPatente(String(crudo.patente ?? ""));
  const anio = Math.floor(Number(crudo.anio));
  const anioMax = new Date().getFullYear() + 1;

  if (!marca || !modelo) return { error: "Completá marca y modelo de tu auto." };
  if (!Number.isInteger(anio) || anio < 1950 || anio > anioMax) return { error: "Revisá el año del auto." };
  if (patente.length < 5 || patente.length > 8) return { error: "Revisá la patente del auto." };
  if (!color) return { error: "Completá el color del auto." };
  if (!TAMANOS.includes(crudo.tamano)) return { error: "Elegí el tamaño del auto." };
  if (!CONDICIONES.includes(crudo.condicion)) return { error: "Contanos si el auto es 0 km o usado." };

  return {
    vehiculo: { marca, modelo, anio, patente, color, tamano: crudo.tamano, condicion: crudo.condicion },
  };
}

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generarCodigo(): string {
  let codigo = "JMF-";
  for (let i = 0; i < 4; i++) codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  return codigo;
}

export async function crearReserva(
  input: ReservaInput
): Promise<{ ok: true; reserva: ReservaConfirmada } | { ok: false; error: string }> {
  // --- Validación de lo que llega (no se confía en la pantalla) ---
  const telefonoNorm = validarTelefono(input?.telefono);
  if (!telefonoNorm) return { ok: false, error: ERROR_TELEFONO };
  const telefono = String(input.telefono).trim().slice(0, 30);
  const nombre = texto(input.nombre, 120);
  const email = texto(input.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Revisá el email." };
  if (!esFechaISO(input.fecha) || !/^\d{2}:\d{2}$/.test(String(input.franja_desde))) {
    return { ok: false, error: "Elegí el día y la franja horaria." };
  }
  const canal = input.canal as CanalReserva;
  if (!(canal in CANAL_LABEL)) return { ok: false, error: "Contanos cómo nos conociste." };

  try {
    const supabase = createAdminClient();
    const ctx = await obtenerContextoAgenda(supabase);

    const validacionItems = validarItems(input.items, ctx.reservables);
    if ("error" in validacionItems) return { ok: false, error: validacionItems.error };
    const { items } = validacionItems;

    const franja = validarFranja(input.fecha, input.franja_desde, items, ctx);
    if (!franja.ok) return { ok: false, error: franja.error };

    // --- Cliente: se reconoce por celular (respuestas 3.1 a 3.4) ---
    const notas: string[] = [];
    let cliente = await buscarClientePorTelefono(supabase, telefonoNorm);

    if (cliente) {
      const { count, error: errorCount } = await supabase
        .from("turnos")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", cliente.id)
        .in("estado", ["agendado", "a_confirmar"])
        .gte("fecha", ctx.hoy);
      if (errorCount) throw new Error(errorCount.message);
      if ((count ?? 0) >= ctx.config.max_pendientes_por_celular) {
        return {
          ok: false,
          error: `Ya tenés ${count} reservas pendientes con este celular. Escribinos por WhatsApp si querés sumar o cambiar un turno.`,
        };
      }

      if (nombre && nombre.toLowerCase() !== cliente.nombre_completo.trim().toLowerCase()) {
        notas.push(`Nombre ingresado al reservar: ${nombre}`);
      }
      const cambios: Record<string, unknown> = {};
      if (email) {
        if (!cliente.email) cambios.email = email;
        else if (email.toLowerCase() !== cliente.email.toLowerCase()) notas.push(`Email ingresado al reservar: ${email}`);
      }
      if (input.acepta_promos && !cliente.acepta_promos) cambios.acepta_promos = true;
      if (Object.keys(cambios).length > 0) {
        const { error } = await supabase.from("clientes").update(cambios).eq("id", cliente.id);
        if (error) throw new Error(error.message);
      }
    } else {
      if (!nombre) return { ok: false, error: "Completá tu nombre y apellido." };
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          nombre_completo: nombre,
          telefono,
          email: email || null,
          como_llego: CANAL_LABEL[canal],
          origen: "detailing",
          acepta_promos: !!input.acepta_promos,
        })
        .select("id, nombre_completo, email, notas, acepta_promos")
        .single();
      if (error) throw new Error(error.message);
      cliente = data as ClienteEncontrado;
    }

    // --- Vehículo ---
    let vehiculoId: string;
    let autoTexto: string;
    let patenteTexto: string;

    if (input.vehiculo_id) {
      const { data: vehiculo, error } = await supabase
        .from("vehiculos")
        .select("id, marca, modelo, patente")
        .eq("id", input.vehiculo_id)
        .eq("cliente_id", cliente.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!vehiculo) return { ok: false, error: "No encontramos ese auto. Volvé a elegirlo o cargalo como auto nuevo." };
      vehiculoId = vehiculo.id as string;
      autoTexto = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ") || "Auto";
      patenteTexto = enmascararPatente(vehiculo.patente as string | null);
    } else {
      const validacion = validarVehiculoNuevo(input.vehiculo);
      if ("error" in validacion) return { ok: false, error: validacion.error };
      const v = validacion.vehiculo;

      const { data: existentes, error: errorExistentes } = await supabase
        .from("vehiculos")
        .select("id, marca, modelo, patente, anio, color, tamano, condicion")
        .eq("cliente_id", cliente.id);
      if (errorExistentes) throw new Error(errorExistentes.message);
      const mismo = (existentes ?? []).find((e) => e.patente && normalizarPatente(e.patente as string) === v.patente);

      if (mismo) {
        // Mismo auto ya cargado: se completa lo que falte, sin pisar datos.
        const faltantes: Record<string, unknown> = {};
        if (!mismo.anio) faltantes.anio = v.anio;
        if (!mismo.color) faltantes.color = v.color;
        if (!mismo.tamano) faltantes.tamano = v.tamano;
        if (!mismo.condicion) faltantes.condicion = v.condicion;
        if (Object.keys(faltantes).length > 0) {
          const { error } = await supabase.from("vehiculos").update(faltantes).eq("id", mismo.id);
          if (error) throw new Error(error.message);
        }
        const cargado = [mismo.marca, mismo.modelo].filter(Boolean).join(" ").toLowerCase();
        if (cargado && cargado !== `${v.marca} ${v.modelo}`.toLowerCase()) {
          notas.push(`Auto ingresado al reservar: ${v.marca} ${v.modelo} ${v.anio}`);
        }
        vehiculoId = mismo.id as string;
      } else {
        const { data, error } = await supabase
          .from("vehiculos")
          .insert({ cliente_id: cliente.id, ...v })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        vehiculoId = data.id as string;
      }
      autoTexto = `${v.marca} ${v.modelo}`;
      patenteTexto = v.patente;
    }

    // --- Turno ---
    const servicioDe = (id: string) => ctx.reservables.find((s) => s.id === id)!;
    const aConfirmar = items.some((i) => servicioDe(i.servicio_id).reserva_online === "consulta");
    const estado = aConfirmar ? "a_confirmar" : "agendado";
    const servicios_detalle = items.map((i) => {
      const s = servicioDe(i.servicio_id);
      return {
        servicio_id: i.servicio_id,
        nombre: s.nombre,
        variante: i.variante,
        variante_nombre: i.variante != null ? s.variantes[i.variante].nombre : null,
        cantidad: i.cantidad,
        precio_texto: textoPrecio(precioItem(s, i)),
      };
    });
    const precioEstimado = textoPrecioTotal(ctx.reservables, items);
    const serviciosTexto = items.map((i) => nombreItem(servicioDe(i.servicio_id), i)).join(" + ");

    let codigo = "";
    for (let intento = 0; intento < 5; intento++) {
      codigo = generarCodigo();
      const { error } = await supabase.from("turnos").insert({
        cliente_id: cliente.id,
        vehiculo_id: vehiculoId,
        servicios_previstos: items.map((i) => i.servicio_id),
        fecha: input.fecha,
        hora: franja.franja.desde,
        hora_hasta: franja.franja.hasta,
        estado,
        origen: "online",
        fecha_fin_estimada: franja.fin,
        codigo,
        puerta_a_puerta: !!input.puerta_a_puerta,
        canal,
        servicios_detalle,
        precio_estimado: precioEstimado,
        notas: notas.length > 0 ? notas.join("\n") : null,
      });
      if (!error) break;
      if (error.code !== "23505" || intento === 4) throw new Error(error.message);
    }

    revalidatePath("/agenda");
    revalidatePath("/");

    return {
      ok: true,
      reserva: {
        codigo,
        estado,
        cliente: cliente.nombre_completo.trim().split(/\s+/)[0] ?? "",
        auto: autoTexto,
        patente: patenteTexto,
        servicios: serviciosTexto,
        fecha: input.fecha,
        franja_desde: franja.franja.desde,
        franja_hasta: franja.franja.hasta,
        fecha_listo: franja.fin,
        precio: precioEstimado,
        puerta_a_puerta: !!input.puerta_a_puerta,
      },
    };
  } catch (e) {
    console.error("crearReserva", e);
    return { ok: false, error: MENSAJE_ERROR_GENERAL };
  }
}
