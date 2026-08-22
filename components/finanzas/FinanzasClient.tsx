"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MovimientoForm } from "./MovimientoForm";
import { eliminarMovimiento } from "@/app/(app)/finanzas/actions";
import { formatARS, formatFecha } from "@/lib/format";
import { CATEGORIAS, MARCA_LABEL, type MarcaMovimiento, type Movimiento } from "@/lib/types/movimiento";
import type { TotalesPorMarca } from "@/lib/data/movimientos";

const MARCAS_ORDEN: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];

const MEDIO_PAGO_LABEL: Record<string, string> = {
  efectivo_pesos: "Efectivo pesos",
  efectivo_dolares: "Efectivo dólares",
  transferencia: "Transferencia",
  cheque: "Cheque",
  usdt: "USDT",
};

export function FinanzasClient({
  movimientos,
  totalesPorMarca,
  total,
  filtros,
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
}) {
  const [alta, setAlta] = useState<"ingreso" | "egreso" | null>(null);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todasLasCategorias = [
    ...new Set(
      Object.values(CATEGORIAS.ingreso).flat().concat(Object.values(CATEGORIAS.egreso).flat())
    ),
  ].sort();

  const borrar = (id: string) => {
    if (!confirm("¿Eliminar este movimiento? No se puede deshacer.")) return;
    setErrorBorrar(null);
    startTransition(async () => {
      const resultado = await eliminarMovimiento(id);
      if (resultado.error) setErrorBorrar(resultado.error);
    });
  };

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
        <div className="flex gap-2">
          <Button variante="secundario" onClick={() => setAlta("egreso")}>
            <Minus size={16} />
            Egreso
          </Button>
          <Button onClick={() => setAlta("ingreso")}>
            <Plus size={16} />
            Ingreso
          </Button>
        </div>
      </div>

      {alta && (
        <Card>
          <CardHeader title={alta === "ingreso" ? "Nuevo ingreso" : "Nuevo egreso"} />
          <MovimientoForm
            tipo={alta}
            onCancelar={() => setAlta(null)}
            onGuardado={() => setAlta(null)}
          />
        </Card>
      )}

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {MARCAS_ORDEN.map((m) => (
          <TotalCard key={m} titulo={MARCA_LABEL[m]} totales={totalesPorMarca[m]} />
        ))}
        <TotalCard titulo="Total" totales={total} destacado />
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

      {errorBorrar && (
        <p className="text-sm text-rojo" role="alert">
          {errorBorrar}
        </p>
      )}

      {/* Lista */}
      {movimientos.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay movimientos con estos filtros.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
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
                      <button
                        onClick={() => borrar(m.id)}
                        disabled={isPending}
                        className="text-texto-secundario hover:text-rojo disabled:opacity-50"
                        aria-label="Eliminar movimiento"
                      >
                        <Trash2 size={14} />
                      </button>
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
  destacado,
}: {
  titulo: string;
  totales: TotalesPorMarca;
  destacado?: boolean;
}) {
  const enRojo = totales.neto < 0;
  return (
    <Card className={destacado ? "border-dorado/40" : undefined}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-texto-secundario">{titulo}</span>
        {enRojo && (
          <Badge tono="negativo">
            <AlertTriangle size={12} className="mr-1" />
            Rojo
          </Badge>
        )}
      </div>
      <span
        className={`font-display text-xl font-semibold ${enRojo ? "text-rojo" : "text-verde"}`}
      >
        {formatARS(totales.neto)}
      </span>
      <div className="flex justify-between text-xs text-texto-secundario mt-1">
        <span>+{formatARS(totales.ingresos)}</span>
        <span>-{formatARS(totales.egresos)}</span>
      </div>
    </Card>
  );
}
