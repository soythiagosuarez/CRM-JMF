"use client";

import { useActionState, useState } from "react";
import { Clock, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { actualizarHorarios, type EstadoConfigForm } from "@/app/(app)/config/actions";
import { DIAS_SEMANA, DIA_LABEL, resumenHorarios } from "@/lib/types/config";
import type { Horarios } from "@/lib/types/config";

const estadoInicial: EstadoConfigForm = {};

export function EditableHorariosForm({ horarios }: { horarios: Horarios }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoConfigForm, formData: FormData) => {
      const resultado = await actualizarHorarios(prev, formData);
      if (resultado.ok) setAbierto(false);
      return resultado;
    },
    estadoInicial
  );

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 text-sm text-texto">
          <Clock size={16} className="text-texto-secundario shrink-0 mt-0.5" />
          <p>{resumenHorarios(horarios)}</p>
        </div>
        <button
          onClick={() => setAbierto(true)}
          className="text-texto-secundario hover:text-texto shrink-0"
          aria-label="Editar horarios"
        >
          <Pencil size={14} />
        </button>
      </div>

      {abierto && (
        <Modal titulo="Editar horarios de atención" onCerrar={() => setAbierto(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {DIAS_SEMANA.map((dia) => (
                <FilaDia key={dia} dia={dia} horario={horarios[dia]} />
              ))}
            </div>

            {estado.error && (
              <p className="text-sm text-rojo" role="alert">
                {estado.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variante="secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function FilaDia({ dia, horario }: { dia: keyof typeof DIA_LABEL; horario: Horarios[keyof Horarios] }) {
  const [cerrado, setCerrado] = useState(horario.cerrado);

  return (
    <div className="grid grid-cols-[6rem_1fr_1fr_1fr] items-center gap-2">
      <span className="text-sm text-texto">{DIA_LABEL[dia]}</span>
      <label className="flex items-center gap-1.5 text-xs text-texto-secundario">
        <input
          type="checkbox"
          name={`${dia}_cerrado`}
          checked={cerrado}
          onChange={(e) => setCerrado(e.target.checked)}
          className="accent-rojo"
        />
        Cerrado
      </label>
      <input
        type="time"
        name={`${dia}_desde`}
        defaultValue={horario.desde}
        disabled={cerrado}
        className="campo disabled:opacity-40"
      />
      <input
        type="time"
        name={`${dia}_hasta`}
        defaultValue={horario.hasta}
        disabled={cerrado}
        className="campo disabled:opacity-40"
      />
    </div>
  );
}
