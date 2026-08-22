"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoFormulario } from "@/app/(app)/clientes/actions";
import type { Vehiculo } from "@/lib/types/cliente";

const estadoInicial: EstadoFormulario = {};

export function VehiculoForm({
  vehiculo,
  accion,
  onCancelar,
  onGuardado,
}: {
  vehiculo?: Vehiculo;
  accion: (
    prevState: EstadoFormulario,
    formData: FormData
  ) => Promise<EstadoFormulario>;
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
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input
          name="marca"
          placeholder="Marca"
          defaultValue={vehiculo?.marca ?? ""}
          className="campo"
        />
        <input
          name="modelo"
          placeholder="Modelo"
          defaultValue={vehiculo?.modelo ?? ""}
          className="campo"
        />
        <input
          name="anio"
          type="number"
          placeholder="Año"
          defaultValue={vehiculo?.anio ?? ""}
          className="campo"
        />
        <input
          name="patente"
          placeholder="Patente"
          defaultValue={vehiculo?.patente ?? ""}
          className="campo uppercase"
        />
        <input
          name="color"
          placeholder="Color"
          defaultValue={vehiculo?.color ?? ""}
          className="campo sm:col-span-2"
        />
        <input
          name="detalles"
          placeholder="Detalles / observaciones"
          defaultValue={vehiculo?.detalles ?? ""}
          className="campo sm:col-span-2"
        />
      </div>

      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
