"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoFormulario } from "@/app/(app)/clientes/actions";
import type { Cliente, OrigenCliente } from "@/lib/types/cliente";

const estadoInicial: EstadoFormulario = {};

export function ClienteForm({
  cliente,
  origenInicial,
  accion,
  onCancelar,
  onGuardado,
  textoBoton = "Guardar",
}: {
  cliente?: Cliente;
  origenInicial?: OrigenCliente;
  accion: (
    prevState: EstadoFormulario,
    formData: FormData
  ) => Promise<EstadoFormulario>;
  onCancelar?: () => void;
  onGuardado?: () => void;
  textoBoton?: string;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoFormulario, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado?.();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="origen" className="text-sm text-texto-secundario">
            Marca de origen
          </label>
          <select
            id="origen"
            name="origen"
            required
            defaultValue={cliente?.origen ?? origenInicial ?? "detailing"}
            className="campo"
          >
            <option value="detailing">Detailing</option>
            <option value="classmotor">Classmotor</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="nombre_completo" className="text-sm text-texto-secundario">
            Nombre completo
          </label>
          <input
            id="nombre_completo"
            name="nombre_completo"
            defaultValue={cliente?.nombre_completo}
            required
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="telefono" className="text-sm text-texto-secundario">
            Teléfono
          </label>
          <input
            id="telefono"
            name="telefono"
            placeholder="5491122334455"
            defaultValue={cliente?.telefono ?? ""}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-texto-secundario">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={cliente?.email ?? ""}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="como_llego" className="text-sm text-texto-secundario">
            Cómo llegó
          </label>
          <input
            id="como_llego"
            name="como_llego"
            placeholder="ej. Instagram, recomendado, pasó por el taller"
            defaultValue={cliente?.como_llego ?? ""}
            className="campo"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notas" className="text-sm text-texto-secundario">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={cliente?.notas ?? ""}
          className="campo resize-none"
        />
      </div>

      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancelar && (
          <Button type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : textoBoton}
        </Button>
      </div>
    </form>
  );
}
