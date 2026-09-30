import { createClient } from "@/lib/supabase/server";
import { listarMovimientos, calcularTotales } from "@/lib/data/movimientos";
import { listarOrdenes } from "@/lib/data/ordenes";
import { listarRecordatorios } from "@/lib/data/recordatorios";
import { listarReservasSinRevisar } from "@/lib/data/turnos";
import { obtenerResumenesFidelizacion } from "@/lib/data/fidelizacion";
import { obtenerClientesPorIds } from "@/lib/data/clientes";
import { debeAlertar } from "@/lib/fidelizacion/reglas";
import type { AlertaPremio } from "@/lib/types/fidelizacion";
import { debeAlertar as debeAlertarRecordatorio } from "@/lib/types/recordatorio";

function rangoMesActual() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { desde, hasta };
}

function rangoSemanaActual() {
  const hoy = new Date();
  const diaSemana = (hoy.getDay() + 6) % 7; // lunes=0
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diaSemana);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: lunes.toISOString().slice(0, 10), hasta: domingo.toISOString().slice(0, 10) };
}

export async function obtenerDashboard() {
  const supabase = await createClient();
  const { desde: desdeMes, hasta: hastaMes } = rangoMesActual();
  const { desde: desdeSemana, hasta: hastaSemana } = rangoSemanaActual();

  const [movimientosMes, ordenes, recordatorios, reservasNuevas, resumenes] = await Promise.all([
    listarMovimientos({ desde: desdeMes, hasta: hastaMes }),
    listarOrdenes(),
    listarRecordatorios(),
    listarReservasSinRevisar(),
    obtenerResumenesFidelizacion(),
  ]);

  // Fidelización: clientes a los que hay que avisarles que tienen premio.
  const conPremio = [...resumenes.entries()].filter(([, r]) => debeAlertar(r.estado_aviso));
  const clientesConPremio = new Map(
    (await obtenerClientesPorIds(conPremio.map(([id]) => id))).map((c) => [c.id, c])
  );
  const alertasPremios: AlertaPremio[] = conPremio
    .filter(([id]) => clientesConPremio.has(id) && clientesConPremio.get(id)!.origen !== "classmotor")
    .map(([id, r]) => ({
      clienteId: id,
      nombre: clientesConPremio.get(id)!.nombre_completo,
      telefono: clientesConPremio.get(id)!.telefono,
      saldo: r.saldo,
      premios: r.premios_disponibles.map((p) => p.nombre),
      reaviso: r.estado_aviso === "reavisar",
    }));

  const { porMarca, total } = calcularTotales(movimientosMes);

  const autosEnTaller = ordenes.filter((o) => o.estado !== "entregado");

  // Órdenes del mes (para meta y mix de servicios), con nombre del servicio.
  const { data: ordenesMesData, error: errorOrdenesMes } = await supabase
    .from("ordenes")
    .select("fecha_ingreso, servicios(nombre)")
    .gte("fecha_ingreso", desdeMes)
    .lte("fecha_ingreso", hastaMes);
  if (errorOrdenesMes) throw new Error(errorOrdenesMes.message);

  type OrdenMes = { fecha_ingreso: string; servicios: { nombre: string } | null };
  const ordenesMes = (ordenesMesData ?? []) as unknown as OrdenMes[];

  const mixServicios = new Map<string, number>();
  for (const o of ordenesMes) {
    const nombre = o.servicios?.nombre ?? "Otro";
    mixServicios.set(nombre, (mixServicios.get(nombre) ?? 0) + 1);
  }

  const ppfDelMes = ordenesMes.filter((o) => o.servicios?.nombre === "PPF").length;
  const ceramicoDeLaSemana = ordenesMes.filter(
    (o) =>
      o.servicios?.nombre === "Tratamiento cerámico" &&
      o.fecha_ingreso >= desdeSemana &&
      o.fecha_ingreso <= hastaSemana
  ).length;

  const recordatoriosProximos = recordatorios
    .filter((r) => r.estado === "pendiente")
    .sort((a, b) => (a.fecha_proxima ?? "").localeCompare(b.fecha_proxima ?? ""))
    .slice(0, 5);

  const alertasRecordatorios = recordatorios.filter((r) => debeAlertarRecordatorio(r));

  return {
    autosEnTallerCantidad: autosEnTaller.length,
    autosEnTaller,
    ingresosMes: total.ingresos,
    egresosMes: total.egresos,
    netoMes: total.neto,
    finanzasPorMarca: porMarca,
    metaMes: {
      ppf: { actual: ppfDelMes, objetivo: 3 },
      ceramicoSemana: { actual: ceramicoDeLaSemana, objetivo: 1 },
    },
    mixServicios: [...mixServicios.entries()].map(([servicio, cantidad]) => ({
      servicio,
      cantidad,
    })),
    recordatoriosProximos,
    alertasRecordatorios,
    reservasNuevas,
    alertasPremios,
  };
}
