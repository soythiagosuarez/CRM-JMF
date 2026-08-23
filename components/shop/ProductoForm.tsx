"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoFormulario } from "@/app/(app)/shop/actions";
import type { Producto } from "@/lib/types/producto";

const estadoInicial: EstadoFormulario = {};

export function ProductoForm({
  producto,
  accion,
  onCancelar,
  onGuardado,
}: {
  producto?: Producto;
  accion: (prevState: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoFormulario, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nombre" className="text-sm text-texto-secundario">
          Nombre
        </label>
        <input id="nombre" name="nombre" defaultValue={producto?.nombre} required className="campo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock_actual" className="text-sm text-texto-secundario">
            Stock actual
          </label>
          <input
            id="stock_actual"
            name="stock_actual"
            type="number"
            min="0"
            required
            defaultValue={producto?.stock_actual ?? 0}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stock_minimo" className="text-sm text-texto-secundario">
            Stock mínimo
          </label>
          <input
            id="stock_minimo"
            name="stock_minimo"
            type="number"
            min="0"
            required
            defaultValue={producto?.stock_minimo ?? 4}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_venta" className="text-sm text-texto-secundario">
            Precio venta
          </label>
          <input
            id="precio_venta"
            name="precio_venta"
            type="number"
            min="0"
            defaultValue={producto?.precio_venta ?? ""}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_costo" className="text-sm text-texto-secundario">
            Precio costo
          </label>
          <input
            id="precio_costo"
            name="precio_costo"
            type="number"
            min="0"
            defaultValue={producto?.precio_costo ?? ""}
            className="campo"
          />
        </div>
      </div>

      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : producto ? "Guardar" : "Cargar producto"}
        </Button>
      </div>
    </form>
  );
}
