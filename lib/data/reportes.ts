import { createClient } from "@/lib/supabase/server";
import { listarMovimientos, calcularTotales } from "@/lib/data/movimientos";
import { MARCA_LABEL, type MarcaMovimiento } from "@/lib/types/movimiento";

export interface ReporteMes {
  desde: string;
  hasta: string;
  facturacion: number;
  egresos: number;
  neto: number;
  porMarca: Map<MarcaMovimiento, { ingresos: number; egresos: number; neto: number }>;
  marcaMasRentable: { marca: string; neto: number } | null;
  servicioMasRentable: { servicio: string; monto: number } | null;
  movimientos: Awaited<ReturnType<typeof listarMovimientos>>;
}

export function rangoDelMes(referencia: string) {
  const [anio, mes] = referencia.split("-").map(Number);
  const desde = new Date(anio, mes - 1, 1).toISOString().slice(0, 10);
  const hasta = new Date(anio, mes, 0).toISOString().slice(0, 10);
  return { desde, hasta };
}

/** referencia en formato "YYYY-MM" (mes a reportar). */
export async function obtenerReporteMes(referencia: string): Promise<ReporteMes> {
  const { desde, hasta } = rangoDelMes(referencia);
  const supabase = await createClient();

  const [movimientos, ordenesCobradasData] = await Promise.all([
    listarMovimientos({ desde, hasta }),
    supabase
      .from("ordenes")
      .select("monto_ars, servicios(nombre)")
      .eq("estado_pago", "cobrado")
      .gte("fecha_cobro", desde)
      .lte("fecha_cobro", hasta),
  ]);

  const { porMarca, total } = calcularTotales(movimientos);

  let marcaMasRentable: { marca: string; neto: number } | null = null;
  for (const marca of ["detailing", "shop", "classmotor"] as MarcaMovimiento[]) {
    const t = porMarca.get(marca);
    if (!t) continue;
    if (!marcaMasRentable || t.neto > marcaMasRentable.neto) {
      marcaMasRentable = { marca: MARCA_LABEL[marca], neto: t.neto };
    }
  }

  const porServicio = new Map<string, number>();
  type OrdenCobrada = { monto_ars: number | null; servicios: { nombre: string } | null };
  for (const o of (ordenesCobradasData.data ?? []) as unknown as OrdenCobrada[]) {
    const nombre = o.servicios?.nombre ?? "Otro";
    porServicio.set(nombre, (porServicio.get(nombre) ?? 0) + (o.monto_ars ?? 0));
  }
  let servicioMasRentable: { servicio: string; monto: number } | null = null;
  for (const [servicio, monto] of porServicio) {
    if (!servicioMasRentable || monto > servicioMasRentable.monto) {
      servicioMasRentable = { servicio, monto };
    }
  }

  return {
    desde,
    hasta,
    facturacion: total.ingresos,
    egresos: total.egresos,
    neto: total.neto,
    porMarca,
    marcaMasRentable,
    servicioMasRentable,
    movimientos,
  };
}
