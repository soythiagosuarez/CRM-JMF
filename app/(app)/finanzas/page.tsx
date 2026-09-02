import { listarMovimientos, calcularTotales } from "@/lib/data/movimientos";
import { obtenerConfiguracion } from "@/lib/data/config";
import { FinanzasClient } from "@/components/finanzas/FinanzasClient";

function rangoMesActual() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { desde, hasta };
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{
    marca?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
    medio_pago?: string;
  }>;
}) {
  const params = await searchParams;
  const rangoDefault = rangoMesActual();
  const filtros = {
    marca: (params.marca as "detailing" | "shop" | "classmotor" | "compartido") || undefined,
    categoria: params.categoria || undefined,
    desde: params.desde || rangoDefault.desde,
    hasta: params.hasta || rangoDefault.hasta,
    medio_pago: params.medio_pago || undefined,
  };

  const [movimientos, configuracion] = await Promise.all([
    listarMovimientos(filtros),
    obtenerConfiguracion(),
  ]);
  const { porMarca, total } = calcularTotales(movimientos);

  return (
    <FinanzasClient
      movimientos={movimientos}
      totalesPorMarca={Object.fromEntries(porMarca)}
      total={total}
      filtros={filtros}
      categoriasMovimiento={configuracion.categorias_movimiento}
    />
  );
}
