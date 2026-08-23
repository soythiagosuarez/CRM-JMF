"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { venderProducto, type EstadoVentaForm } from "@/app/(app)/shop/actions";
import type { Producto } from "@/lib/types/producto";

const estadoInicial: EstadoVentaForm = {};

export function VentaForm({
  producto,
  onCancelar,
  onGuardado,
}: {
  producto: Producto;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoVentaForm, formData: FormData) => {
      const resultado = await venderProducto(producto.id, prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`cantidad-${producto.id}`} className="text-xs text-texto-secundario">
            Cantidad
          </label>
          <input
            id={`cantidad-${producto.id}`}
            name="cantidad"
            type="number"
            min="1"
            max={producto.stock_actual}
            defaultValue={1}
            required
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`precio-${producto.id}`} className="text-xs text-texto-secundario">
            Precio unitario
          </label>
          <input
            id={`precio-${producto.id}`}
            name="precio_unitario"
            type="number"
            min="0"
            step="0.01"
            defaultValue={producto.precio_venta ?? ""}
            required
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`fecha-${producto.id}`} className="text-xs text-texto-secundario">
            Fecha
          </label>
          <input
            id={`fecha-${producto.id}`}
            name="fecha"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`medio-${producto.id}`} className="text-xs text-texto-secundario">
            Medio de pago
          </label>
          <select
            id={`medio-${producto.id}`}
            name="medio_pago"
            required
            defaultValue=""
            className="campo"
          >
            <option value="" disabled>
              Elegí uno
            </option>
            <option value="efectivo_pesos">Efectivo pesos</option>
            <option value="efectivo_dolares">Efectivo dólares</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="usdt">USDT</option>
          </select>
        </div>
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Confirmar venta"}
        </Button>
      </div>
    </form>
  );
}
