import { createClient } from "@/lib/supabase/server";
import type { MarcaMovimiento, Movimiento } from "@/lib/types/movimiento";

export interface FiltrosMovimientos {
  marca?: MarcaMovimiento;
  categoria?: string;
  desde?: string;
  hasta?: string;
  medio_pago?: string;
}

export async function listarMovimientos(filtros: FiltrosMovimientos = {}): Promise<Movimiento[]> {
  const supabase = await createClient();
  let query = supabase.from("movimientos").select("*").order("fecha", { ascending: false });

  if (filtros.marca) query = query.eq("marca", filtros.marca);
  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.desde) query = query.gte("fecha", filtros.desde);
  if (filtros.hasta) query = query.lte("fecha", filtros.hasta);
  if (filtros.medio_pago) query = query.eq("medio_pago", filtros.medio_pago);

  const { data, error } = await query;
  if (error) throw new Error("No se pudieron cargar los movimientos: " + error.message);
  return data as Movimiento[];
}

export interface TotalesPorMarca {
  ingresos: number;
  egresos: number;
  neto: number;
}

/**
 * Totales por marca (§7 regla 4: compartido va aparte, el neto por marca
 * es operativo puro; el total general sí incluye compartido porque
 * finalmente sale de la caja del negocio).
 */
export function calcularTotales(movimientos: Movimiento[]) {
  const marcas: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];
  const porMarca = new Map<MarcaMovimiento, TotalesPorMarca>();
  for (const m of marcas) porMarca.set(m, { ingresos: 0, egresos: 0, neto: 0 });

  for (const mov of movimientos) {
    const t = porMarca.get(mov.marca)!;
    if (mov.tipo === "ingreso") t.ingresos += mov.monto_ars;
    else t.egresos += mov.monto_ars;
    t.neto = t.ingresos - t.egresos;
  }

  const total: TotalesPorMarca = { ingresos: 0, egresos: 0, neto: 0 };
  for (const t of porMarca.values()) {
    total.ingresos += t.ingresos;
    total.egresos += t.egresos;
  }
  total.neto = total.ingresos - total.egresos;

  return { porMarca, total };
}
