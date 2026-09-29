import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizarConfigFidelizacion } from "@/lib/reservas/config";
import { montoBasico, puntosPorMonto } from "./reglas";

/**
 * Suma los puntos de una orden recién cobrada (respuesta 9.1: los puntos
 * se ganan al cobrar). 1 punto cada $5.000 cobrados en servicios
 * básicos; PPF, cerámico y acrílico no suman. Si el turno vino de la
 * agenda online y Joaco cargó un bonus para eso, también lo suma.
 *
 * Nunca hace fallar el cobro: si algo sale mal, lo deja en el log.
 * Una orden suma una sola vez (índice único en la base).
 */
export async function sumarPuntosPorOrden(supabase: SupabaseClient, ordenId: string): Promise<void> {
  try {
    const { data: orden, error } = await supabase
      .from("ordenes")
      .select("cliente_id, turno_id, servicio_principal_id, servicios_adicionales, precio_total, monto_ars")
      .eq("id", ordenId)
      .single();
    if (error) throw error;
    if (!orden.cliente_id) return;

    const adicionales = (orden.servicios_adicionales ?? []) as { servicio_id: string; precio: number }[];
    const ids = [orden.servicio_principal_id, ...adicionales.map((a) => a.servicio_id)].filter(Boolean);

    const [{ data: servicios, error: errorServicios }, { data: config, error: errorConfig }] = await Promise.all([
      supabase.from("servicios").select("id, nombre, categoria_fidelizacion").in("id", ids),
      supabase.from("configuracion").select("fidelizacion").eq("id", "global").single(),
    ]);
    if (errorServicios) throw errorServicios;
    if (errorConfig) throw errorConfig;

    const fidelizacion = normalizarConfigFidelizacion(config?.fidelizacion);
    const esBasico = (id: string) =>
      (servicios ?? []).find((s) => s.id === id)?.categoria_fidelizacion !== "premium";
    const nombrePrincipal =
      (servicios ?? []).find((s) => s.id === orden.servicio_principal_id)?.nombre ?? "servicio";

    const monto = montoBasico(
      Number(orden.monto_ars ?? 0),
      orden.precio_total != null ? Number(orden.precio_total) : null,
      { basico: esBasico(orden.servicio_principal_id), precio: null },
      adicionales.map((a) => ({ basico: esBasico(a.servicio_id), precio: Number(a.precio ?? 0) }))
    );
    const puntos = puntosPorMonto(monto, fidelizacion.pesos_por_punto);

    const filas: Record<string, unknown>[] = [];
    if (puntos > 0) {
      filas.push({
        cliente_id: orden.cliente_id,
        puntos,
        tipo: "servicio",
        motivo: `Servicio cobrado: ${nombrePrincipal}`,
        orden_id: ordenId,
      });
    }

    const bonusOnline = fidelizacion.puntos_por_motivo.reserva_online ?? 0;
    if (bonusOnline > 0 && orden.turno_id) {
      const { data: turno } = await supabase.from("turnos").select("origen").eq("id", orden.turno_id).maybeSingle();
      if (turno?.origen === "online") {
        filas.push({
          cliente_id: orden.cliente_id,
          puntos: bonusOnline,
          tipo: "reserva_online",
          motivo: "Reservó por la agenda online",
          orden_id: ordenId,
        });
      }
    }

    for (const fila of filas) {
      const { error: errorInsert } = await supabase.from("puntos_movimientos").insert(fila);
      // 23505 = ya se habían sumado los puntos de esta orden.
      if (errorInsert && errorInsert.code !== "23505") throw errorInsert;
    }
  } catch (e) {
    console.error("No se pudieron sumar los puntos de la orden", ordenId, e);
  }
}
