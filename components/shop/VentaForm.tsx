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
      <div className="grid grid-cols-3 gap-2">
        <input
          name="cantidad"
          type="number"
          min="1"
          max={producto.stock_actual}
          defaultValue={1}
          required
          placeholder="Cantidad"
          className="campo"
        />
        <input
          name="precio_unitario"
          type="number"
          min="0"
          step="0.01"
          defaultValue={producto.precio_venta ?? ""}
          required
          placeholder="Precio unitario"
          className="campo"
        />
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className="campo"
        />
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <div className="flex justify-end gap-2">
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
