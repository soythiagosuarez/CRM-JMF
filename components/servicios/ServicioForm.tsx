"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { MontoInput } from "@/components/ui/MontoInput";
import type { EstadoServicioForm } from "@/app/(app)/servicios/actions";
import type { Servicio } from "@/lib/types/servicio";

const estadoInicial: EstadoServicioForm = {};

export function ServicioForm({
  servicio,
  accion,
  onCancelar,
  onGuardado,
}: {
  servicio?: Servicio;
  accion: (
    prevState: EstadoServicioForm,
    formData: FormData
  ) => Promise<EstadoServicioForm>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoServicioForm, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nombre" htmlFor="nombre">
          <input
            id="nombre"
            name="nombre"
            defaultValue={servicio?.nombre}
            required
            className="campo"
          />
        </Campo>
        <Campo label="Tiempo estimado" htmlFor="tiempo_estimado">
          <input
            id="tiempo_estimado"
            name="tiempo_estimado"
            placeholder="ej. 5 días, 5 horas"
            defaultValue={servicio?.tiempo_estimado ?? ""}
            className="campo"
          />
        </Campo>
      </div>

      <Campo label="Descripción / qué incluye" htmlFor="descripcion">
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={servicio?.descripcion ?? ""}
          className="campo resize-none"
        />
      </Campo>

      <Campo
        label="Fases (una por línea, en orden)"
        htmlFor="fases"
        ayuda="Se muestran en este orden en el tablero de Autos / Órdenes."
      >
        <textarea
          id="fases"
          name="fases"
          rows={6}
          required
          defaultValue={servicio?.fases.join("\n") ?? ""}
          className="campo resize-none font-mono text-sm"
        />
      </Campo>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Campo label="Precio referencia" htmlFor="precio_referencia" ayuda="Opcional">
          <MontoInput id="precio_referencia" name="precio_referencia" defaultValue={servicio?.precio_referencia} />
        </Campo>
        <Campo
          label="Mantenimiento (meses)"
          htmlFor="mantenimiento_intervalo_meses"
          ayuda="Solo tratamientos"
        >
          <input
            id="mantenimiento_intervalo_meses"
            name="mantenimiento_intervalo_meses"
            type="number"
            min="0"
            step="1"
            defaultValue={servicio?.mantenimiento_intervalo_meses ?? ""}
            className="campo"
          />
        </Campo>
        <Campo label="Renovación (meses)" htmlFor="renovacion_meses" ayuda="Solo tratamientos">
          <input
            id="renovacion_meses"
            name="renovacion_meses"
            type="number"
            min="0"
            step="1"
            defaultValue={servicio?.renovacion_meses ?? ""}
            className="campo"
          />
        </Campo>
      </div>

      <label className="flex items-center gap-2 text-sm text-texto-secundario">
        <input
          type="checkbox"
          name="puerta_a_puerta"
          defaultChecked={servicio?.puerta_a_puerta ?? true}
          className="accent-rojo"
        />
        Puerta a puerta
      </label>

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
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function Campo({
  label,
  htmlFor,
  ayuda,
  children,
}: {
  label: string;
  htmlFor: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-texto-secundario">
        {label} {ayuda && <span className="text-xs">· {ayuda}</span>}
      </label>
      {children}
    </div>
  );
}
