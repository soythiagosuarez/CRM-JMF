"use client";

import { useActionState, useState, useTransition } from "react";
import { Gift, Pencil, Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  actualizarConfigFidelizacion,
  actualizarPremio,
  cambiarActivoPremio,
  crearPremio,
  type EstadoFidelizacionForm,
} from "@/app/(app)/clientes/fidelizacion/actions";
import { formatARS } from "@/lib/format";
import { MOTIVO_PUNTOS_LABEL, type ConfigFidelizacion, type MotivoPuntos } from "@/lib/types/config";
import type { Premio } from "@/lib/types/fidelizacion";

function PremioForm({
  premio,
  onListo,
}: {
  premio?: Premio;
  onListo: () => void;
}) {
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoFidelizacionForm, formData: FormData) => {
      const r = premio ? await actualizarPremio(premio.id, prev, formData) : await crearPremio(prev, formData);
      if (r.ok) onListo();
      return r;
    },
    {} as EstadoFidelizacionForm
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
        <input name="nombre" defaultValue={premio?.nombre} placeholder="Premio (ej. 10% off en cualquier servicio)" className="campo" required />
        <input name="puntos" type="number" min={1} defaultValue={premio?.puntos} placeholder="Puntos" className="campo" required />
      </div>
      <input
        name="condiciones"
        defaultValue={premio?.condiciones ?? ""}
        placeholder="Condiciones (opcional, ej. no aplica a PPF, cerámico ni acrílico)"
        className="campo"
      />
      {estado.error && <p className="text-sm text-rojo">{estado.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onListo}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export function PremiosClient({ premios, config }: { premios: Premio[]; config: ConfigFidelizacion }) {
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [estadoReglas, accionReglas, guardandoReglas] = useActionState(actualizarConfigFidelizacion, {});

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Catálogo de premios"
          subtitle="Lo que el cliente puede canjear con sus puntos. Los premios no vencen y no se suman a otras promos."
          action={
            !creando && (
              <Button variante="secundario" onClick={() => setCreando(true)}>
                <Plus size={16} />
                Nuevo premio
              </Button>
            )
          }
        />
        {creando && (
          <div className="mb-4 rounded-lg border border-borde bg-panel-2 p-3">
            <PremioForm onListo={() => setCreando(false)} />
          </div>
        )}
        {premios.length === 0 && !creando && (
          <p className="text-sm text-texto-secundario">Todavía no hay premios. Cargá el primero.</p>
        )}
        <ul className="flex flex-col gap-2">
          {premios.map((p) =>
            editandoId === p.id ? (
              <li key={p.id} className="rounded-lg border border-borde bg-panel-2 p-3">
                <PremioForm premio={p} onListo={() => setEditandoId(null)} />
              </li>
            ) : (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-lg border border-borde bg-panel-2 px-3 py-2.5 ${
                  p.activo ? "" : "opacity-50"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Gift size={16} className="text-dorado shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-texto">
                      {p.nombre} {!p.activo && <Badge tono="neutro">Inactivo</Badge>}
                    </p>
                    {p.condiciones && <p className="text-xs text-texto-secundario mt-0.5">{p.condiciones}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display text-base font-semibold text-dorado tabular-nums">{p.puntos} pts</span>
                  <button
                    onClick={() => setEditandoId(p.id)}
                    className="text-texto-secundario hover:text-texto"
                    aria-label="Editar premio"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => startTransition(() => cambiarActivoPremio(p.id, !p.activo))}
                    disabled={isPending}
                    className="text-xs text-texto-secundario hover:text-rojo disabled:opacity-50"
                  >
                    {p.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="Cómo se ganan los puntos"
          subtitle="Los puntos se suman solos al cobrar una orden de un servicio básico (PPF, cerámico y acrílico no suman). No vencen."
        />
        <form action={accionReglas} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
              1 punto cada ($)
              <input name="pesos_por_punto" type="number" min={1} defaultValue={config.pesos_por_punto} className="campo" />
              <span className="text-xs">Hoy: {formatARS(config.pesos_por_punto)} cobrados = 1 punto</span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
              Volver a avisar si no responde después de (días)
              <input name="reaviso_dias" type="number" min={1} defaultValue={config.reaviso_dias} className="campo" />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-texto-secundario">
              Puntos sugeridos al sumar a mano <span className="text-xs">· vacío = se escribe cada vez</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(MOTIVO_PUNTOS_LABEL) as MotivoPuntos[])
                .filter((m) => m !== "ajuste")
                .map((m) => (
                  <label key={m} className="grid grid-cols-[1fr_6rem] items-center gap-2 text-sm text-texto">
                    {MOTIVO_PUNTOS_LABEL[m]}
                    <input
                      name={`motivo_${m}`}
                      type="number"
                      min={1}
                      defaultValue={config.puntos_por_motivo[m] ?? ""}
                      className="campo"
                    />
                  </label>
                ))}
            </div>
            <p className="text-xs text-texto-secundario">
              «Reservó por la agenda online» se suma solo cuando se cobra la orden de un turno que entró por la
              agenda online, si tiene un valor cargado.
            </p>
          </div>

          {estadoReglas.error && <p className="text-sm text-rojo">{estadoReglas.error}</p>}
          {estadoReglas.ok && <p className="text-sm text-verde">Guardado.</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={guardandoReglas}>
              {guardandoReglas ? "Guardando..." : "Guardar reglas"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
