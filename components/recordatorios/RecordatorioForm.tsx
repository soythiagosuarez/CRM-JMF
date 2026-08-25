"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { crearRecordatorioNota, type EstadoNotaForm } from "@/app/(app)/recordatorios/actions";

const estadoInicial: EstadoNotaForm = {};

export function RecordatorioForm({
  onCancelar,
  onGuardado,
}: {
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoNotaForm, formData: FormData) => {
      const resultado = await crearRecordatorioNota(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="titulo" className="text-sm text-texto-secundario">
          ¿Qué hay que hacer?
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          placeholder="ej. Grabar contenido para IG, pagar factura de luz, hablarle al proveedor del Shop"
          className="campo"
        />
      </div>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <label htmlFor="fecha_proxima" className="text-sm text-texto-secundario">
          Fecha (opcional)
        </label>
        <input id="fecha_proxima" name="fecha_proxima" type="date" className="campo" />
      </div>

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
          {enviando ? "Guardando..." : "Cargar recordatorio"}
        </Button>
      </div>
    </form>
  );
}
