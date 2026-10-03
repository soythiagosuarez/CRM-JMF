"use client";

import { useActionState, useState, useTransition } from "react";
import { CalendarX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { crearBloqueo, eliminarBloqueo, type EstadoConfigForm } from "@/app/(app)/config/actions";
import { diaDeSemana, fechaLarga } from "@/lib/reservas/fechas";
import type { ConfigReservas } from "@/lib/types/config";
import type { Bloqueo } from "@/lib/types/reserva";

/**
 * Días o franjas en los que no se toman reservas online (vacaciones,
 * feriados que se decide cerrar, eventos, taller lleno) — respuestas
 * 5.9 y 5.10.
 */
export function BloqueosConfig({ bloqueos, config }: { bloqueos: Bloqueo[]; config: ConfigReservas }) {
  const [fecha, setFecha] = useState("");
  const [isPending, startTransition] = useTransition();
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoConfigForm, formData: FormData) => {
      const resultado = await crearBloqueo(prev, formData);
      if (resultado.ok) setFecha("");
      return resultado;
    },
    {} as EstadoConfigForm
  );

  const franjasDelDia = fecha ? config.franjas[diaDeSemana(fecha)] : [];

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr_auto] items-end gap-2">
        <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
          Fecha
          <input
            name="fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="campo"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
          Qué se bloquea
          <select name="franja_desde" defaultValue="" className="campo" key={fecha}>
            <option value="">Todo el día</option>
            {franjasDelDia.map((f) => (
              <option key={f.desde} value={f.desde}>
                Solo {f.desde}–{f.hasta}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
          Motivo
          <input name="motivo" className="campo" placeholder="Ej.: feriado, vacaciones, taller lleno" />
        </label>
        <Button type="submit" disabled={enviando}>
          {enviando ? "..." : "Bloquear"}
        </Button>
      </form>
      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      {bloqueos.length === 0 ? (
        <p className="text-sm text-texto-secundario">
          No hay días bloqueados. Los feriados no se bloquean solos: bloqueá los que decidas cerrar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bloqueos.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-panel-2 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-texto min-w-0">
                <CalendarX size={14} className="text-rojo shrink-0" />
                <span>
                  {fechaLarga(b.fecha)} · {b.franja_desde ? `franja de las ${b.franja_desde}` : "todo el día"}
                  {b.motivo && <span className="text-texto-secundario"> · {b.motivo}</span>}
                </span>
              </span>
              <button
                onClick={() => {
                  if (!confirm("¿Desbloquear este día?")) return;
                  startTransition(() => eliminarBloqueo(b.id!));
                }}
                disabled={isPending}
                className="text-texto-secundario hover:text-rojo disabled:opacity-50 shrink-0"
                aria-label="Desbloquear"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
