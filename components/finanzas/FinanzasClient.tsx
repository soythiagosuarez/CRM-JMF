"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, AlertTriangle, Trash2, Pencil, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MovimientoForm } from "./MovimientoForm";
import { ExportarCsvButton } from "./ExportarCsvButton";
import { crearMovimiento, actualizarMovimiento, eliminarMovimiento } from "@/app/(app)/finanzas/actions";
import { formatARS, formatFecha } from "@/lib/format";
import { MARCA_LABEL, type MarcaMovimiento, type Movimiento } from "@/lib/types/movimiento";
import type { CategoriasMovimiento } from "@/lib/types/config";
import type { TotalesPorMarca } from "@/lib/data/movimientos";

const MARCAS_ORDEN: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];

const MEDIO_PAGO_LABEL: Record<string, string> = {
  efectivo_pesos: "Efectivo pesos",
  efectivo_dolares: "Efectivo dólares",
  transferencia: "Transferencia",
  cheque: "Cheque",
  usdt: "USDT",
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function mesDeFecha(fechaISO: string): string {
  const [anio, mes] = fechaISO.split("-").map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}

function rangoMesAdyacente(desde: string, delta: number) {
  const [anio, mes] = desde.split("-").map(Number);
  const d = new Date(anio, mes - 1 + delta, 1);
  const nuevoDesde = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const nuevoHasta = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { desde: nuevoDesde, hasta: nuevoHasta };
}

export function FinanzasClient({
  movimientos,
  totalesPorMarca,
  total,
  filtros,
  categoriasMovimiento,
}: {
  movimientos: Movimiento[];
  totalesPorMarca: Record<string, TotalesPorMarca>;
  total: TotalesPorMarca;
  filtros: {
    marca?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
    medio_pago?: string;
  };
  categoriasMovimiento: CategoriasMovimiento;
}) {
  const router = useRouter();
  const [alta, setAlta] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todasLasCategorias = [
    ...new Set(
      Object.values(categoriasMovimiento.ingreso)
        .flat()
        .concat(Object.values(categoriasMovimiento.egreso).flat())
    ),
  ].sort();

  const desde = filtros.desde ?? new Date().toISOString().slice(0, 10);
  const hasta = filtros.hasta ?? desde;

  const irAMes = (delta: number) => {
    const { desde: nuevoDesde, hasta: nuevoHasta } = rangoMesAdyacente(desde, delta);
    const params = new URLSearchParams();
    if (filtros.marca) params.set("marca", filtros.marca);
    if (filtros.categoria) params.set("categoria", filtros.categoria);
    if (filtros.medio_pago) params.set("medio_pago", filtros.medio_pago);
    params.set("desde", nuevoDesde);
    params.set("hasta", nuevoHasta);
    router.push(`/finanzas?${params.toString()}`);
  };

  const borrar = (id: string) => {
    if (!confirm("¿Eliminar este movimiento? No se puede deshacer.")) return;
    setErrorAccion(null);
    startTransition(async () => {
      const resultado = await eliminarMovimiento(id);
      if (resultado.error) setErrorAccion(resultado.error);
    });
  };

  const movimientoEditando = editandoId ? movimientos.find((m) => m.id === editandoId) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Finanzas</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Movimientos de las tres marcas + compartido. Filtrado por fecha, marca, categoría y
            medio de pago.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-2">
            <Button onClick={() => setAlta(true)}>
              <Minus size={16} />
              Egreso
            </Button>
            <ExportarCsvButton movimientos={movimientos} nombreArchivo={`finanzas-${desde}_a_${hasta}`} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-texto-secundario max-w-sm text-right">
            <Info size={12} className="shrink-0" />
            No hay botón de ingreso: los cobros de órdenes, ventas de Shop y autos vendidos se
            cargan solos para evitar anotarlos dos veces.
          </p>
        </div>
      </div>

      {alta && (
        <Card>
          <CardHeader title="Nuevo egreso" />
          <MovimientoForm
            tipo="egreso"
            categoriasMovimiento={categoriasMovimiento}
            accion={crearMovimiento}
            onCancelar={() => setAlta(false)}
            onGuardado={() => setAlta(false)}
          />
        </Card>
      )}

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {MARCAS_ORDEN.map((m) => (
          <TotalCard key={m} titulo={MARCA_LABEL[m]} totales={totalesPorMarca[m]} />
        ))}
        <TotalCard titulo="Total" totales={total} />
      </div>

      {/* Navegación de mes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => irAMes(-1)}
          className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => irAMes(1)}
          className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
        <span className="font-display text-base font-semibold text-texto capitalize ml-2">
          {mesDeFecha(desde)}
        </span>
      </div>

      {/* Filtros */}
      <Card>
        <form method="GET" className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <select name="marca" defaultValue={filtros.marca ?? ""} className="campo">
            <option value="">Todas las marcas</option>
            {MARCAS_ORDEN.map((m) => (
              <option key={m} value={m}>
                {MARCA_LABEL[m]}
              </option>
            ))}
          </select>
          <select name="categoria" defaultValue={filtros.categoria ?? ""} className="campo">
            <option value="">Todas las categorías</option>
            {todasLasCategorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="medio_pago" defaultValue={filtros.medio_pago ?? ""} className="campo">
            <option value="">Todos los medios</option>
            {Object.entries(MEDIO_PAGO_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <input type="date" name="desde" defaultValue={filtros.desde} className="campo" />
          <input type="date" name="hasta" defaultValue={filtros.hasta} className="campo" />
          <Button type="submit" variante="secundario" className="col-span-2 sm:col-span-1">
            Filtrar
          </Button>
        </form>
      </Card>

      {errorAccion && (
        <p className="text-sm text-rojo" role="alert">
          {errorAccion}
        </p>
      )}

      {movimientoEditando && (
        <Card>
          <CardHeader title="Editar movimiento" />
          <MovimientoForm
            tipo={movimientoEditando.tipo}
            movimiento={movimientoEditando}
            categoriasMovimiento={categoriasMovimiento}
            accion={actualizarMovimiento.bind(null, movimientoEditando.id)}
            onCancelar={() => setEditandoId(null)}
            onGuardado={() => setEditandoId(null)}
          />
        </Card>
      )}

      {/* Lista */}
      {movimientos.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay movimientos con estos filtros.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-texto-secundario border-b border-borde">
                <th className="font-normal py-2 px-2">Fecha</th>
                <th className="font-normal py-2 px-2">Marca</th>
                <th className="font-normal py-2 px-2">Categoría</th>
                <th className="font-normal py-2 px-2">Descripción</th>
                <th className="font-normal py-2 px-2">Medio</th>
                <th className="font-normal py-2 px-2 text-right">Monto</th>
                <th className="font-normal py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-borde/60 last:border-0">
                  <td className="py-2.5 px-2 text-texto-secundario">{formatFecha(m.fecha)}</td>
                  <td className="py-2.5 px-2">
                    <Badge tono="neutro">{MARCA_LABEL[m.marca]}</Badge>
                  </td>
                  <td className="py-2.5 px-2 text-texto">{m.categoria}</td>
                  <td className="py-2.5 px-2 text-texto-secundario">
                    {m.descripcion || (m.origen !== "manual" ? `Automático (${m.origen})` : "—")}
                  </td>
                  <td className="py-2.5 px-2 text-texto-secundario">
                    {m.medio_pago ? MEDIO_PAGO_LABEL[m.medio_pago] : "—"}
                  </td>
                  <td
                    className={`py-2.5 px-2 text-right font-medium ${
                      m.tipo === "ingreso" ? "text-verde" : "text-rojo"
                    }`}
                  >
                    {m.tipo === "egreso" ? "-" : ""}
                    {formatARS(m.monto_ars)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {m.origen === "manual" && (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditandoId(m.id)}
                          className="text-texto-secundario hover:text-texto"
                          aria-label="Editar movimiento"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => borrar(m.id)}
                          disabled={isPending}
                          className="text-texto-secundario hover:text-rojo disabled:opacity-50"
                          aria-label="Eliminar movimiento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function TotalCard({
  titulo,
  totales,
}: {
  titulo: string;
  totales: TotalesPorMarca;
}) {
  const colorNeto =
    totales.neto > 0 ? "text-verde" : totales.neto < 0 ? "text-rojo" : "text-texto-secundario";
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-texto">{titulo}</span>
        {totales.neto < 0 && (
          <Badge tono="negativo">
            <AlertTriangle size={12} className="mr-1" />
            Rojo
          </Badge>
        )}
      </div>

      <p className="text-xs text-texto-secundario mt-3">Neto</p>
      <span className={`font-display text-xl font-semibold ${colorNeto}`}>
        {formatARS(totales.neto)}
      </span>

      <div className="flex justify-between gap-3 mt-3">
        <div>
          <p className="text-xs text-texto-secundario">Ingresos</p>
          <span className="text-sm text-texto-secundario">{formatARS(totales.ingresos)}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-texto-secundario">Egresos</p>
          <span className="text-sm text-texto-secundario">{formatARS(totales.egresos)}</span>
        </div>
      </div>
    </Card>
  );
}
