"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { crearRecordatorioNota, type EstadoNotaForm } from "@/app/(app)/recordatorios/actions";
import type { FrecuenciaTipo } from "@/lib/types/recordatorio";

const estadoInicial: EstadoNotaForm = {};

export function RecordatorioForm({
  onCancelar,
  onGuardado,
}: {
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [fecha, setFecha] = useState("");
  const [frecuencia, setFrecuencia] = useState<FrecuenciaTipo | "">("");
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

      <div className="rounded-lg border border-borde p-3 flex flex-col gap-3">
        <p className="text-xs text-texto-secundario">
          Fecha y hora exacta, opcional. Si la cargás, el recordatorio se marca como hecho solo
          ese día.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha_proxima" className="text-sm text-texto-secundario">
              Fecha
            </label>
            <input
              id="fecha_proxima"
              name="fecha_proxima"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="campo"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="hora_proxima" className="text-sm text-texto-secundario">
              Hora
            </label>
            <input
              id="hora_proxima"
              name="hora_proxima"
              type="time"
              disabled={!fecha}
              className="campo disabled:opacity-40"
            />
          </div>
        </div>
        {fecha && (
          <label className="flex items-center gap-1.5 text-xs text-texto-secundario">
            <input type="checkbox" name="auto_completar" defaultChecked className="accent-rojo" />
            Marcar como hecho automáticamente ese día
          </label>
        )}
      </div>

      <div className="rounded-lg border border-borde p-3 flex flex-col gap-3">
        <p className="text-xs text-texto-secundario">
          Repetición, opcional. Mientras esté pendiente, te va a aparecer como alerta arriba
          de Inicio cada tanto — la cerrás para confirmar que la viste.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="frecuencia_tipo" className="text-sm text-texto-secundario">
              Cada cuánto recordar
            </label>
            <select
              id="frecuencia_tipo"
              name="frecuencia_tipo"
              value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value as FrecuenciaTipo | "")}
              className="campo"
            >
              <option value="">Sin repetición</option>
              <option value="diario">Todos los días</option>
              <option value="cada_x_dias">Cada X días</option>
              <option value="cada_x_horas_o_minutos">Cada X horas o minutos</option>
            </select>
          </div>

          {frecuencia === "cada_x_dias" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="frecuencia_intervalo_dias" className="text-sm text-texto-secundario">
                Cada cuántos días
              </label>
              <input
                id="frecuencia_intervalo_dias"
                name="frecuencia_intervalo_dias"
                type="number"
                min="1"
                defaultValue="1"
                className="campo"
              />
            </div>
          )}

          {frecuencia === "cada_x_horas_o_minutos" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-texto-secundario">Cada cuánto</label>
              <div className="flex gap-2">
                <input
                  name="frecuencia_intervalo_horas"
                  type="number"
                  min="1"
                  defaultValue="30"
                  className="campo"
                />
                <select name="frecuencia_unidad" defaultValue="minutos" className="campo">
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                </select>
              </div>
            </div>
          )}
        </div>
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
