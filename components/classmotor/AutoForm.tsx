"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoAutoForm } from "@/app/(app)/classmotor/actions";
import type { AutoClassmotor } from "@/lib/types/classmotor";

const estadoInicial: EstadoAutoForm = {};

export function AutoForm({
  auto,
  accion,
  onCancelar,
  onGuardado,
}: {
  auto?: AutoClassmotor;
  accion: (prevState: EstadoAutoForm, formData: FormData) => Promise<EstadoAutoForm>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoAutoForm, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tipo" className="text-sm text-texto-secundario">
          Tipo de operación
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue={auto?.tipo ?? ""}
          className="campo"
        >
          <option value="" disabled>
            Elegí el tipo
          </option>
          <option value="compra_venta">Compra-venta (lo compra JMF)</option>
          <option value="preventa_venta">Preventa/venta (a consignación)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input name="marca" placeholder="Marca" defaultValue={auto?.marca ?? ""} className="campo" />
        <input name="modelo" placeholder="Modelo" defaultValue={auto?.modelo ?? ""} className="campo" />
        <input
          name="anio"
          type="number"
          placeholder="Año"
          defaultValue={auto?.anio ?? ""}
          className="campo"
        />
        <input name="km" type="number" placeholder="Km" defaultValue={auto?.km ?? ""} className="campo" />
        <input
          name="patente"
          placeholder="Patente"
          defaultValue={auto?.patente ?? ""}
          className="campo uppercase"
        />
        <input name="color" placeholder="Color" defaultValue={auto?.color ?? ""} className="campo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_base" className="text-sm text-texto-secundario">
            Precio base
          </label>
          <input
            id="precio_base"
            name="precio_base"
            type="number"
            min="0"
            placeholder="Compra, o precio del cliente"
            defaultValue={auto?.precio_base ?? ""}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_venta" className="text-sm text-texto-secundario">
            Precio de venta
          </label>
          <input
            id="precio_venta"
            name="precio_venta"
            type="number"
            min="0"
            defaultValue={auto?.precio_venta ?? ""}
            className="campo"
          />
        </div>
      </div>

      <textarea
        name="detalles"
        placeholder="Detalles / observaciones"
        rows={2}
        defaultValue={auto?.detalles ?? ""}
        className="campo resize-none"
      />

      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : auto ? "Guardar" : "Cargar auto"}
        </Button>
      </div>
    </form>
  );
}
