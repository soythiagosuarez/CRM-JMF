"use client";

import { useActionState, useState, useTransition } from "react";
import { MessageCircle, Pencil, Check, X, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  cambiarEstadoRecordatorio,
  actualizarRecordatorio,
  type EstadoFechaForm,
} from "@/app/(app)/recordatorios/actions";
import { RecordatorioForm } from "./RecordatorioForm";
import { linkWhatsapp, mensajeMantenimiento, mensajeRenovacion } from "@/lib/whatsapp";
import { formatFecha } from "@/lib/format";
import { TIPO_LABEL, ESTADO_LABEL } from "@/lib/types/recordatorio";
import type { EstadoRecordatorio, RecordatorioConDatos, TipoRecordatorio } from "@/lib/types/recordatorio";

const ESTADO_TONO: Record<EstadoRecordatorio, "neutro" | "positivo" | "negativo"> = {
  pendiente: "neutro",
  hecho: "positivo",
  descartado: "negativo",
};

const TIPO_TONO: Record<TipoRecordatorio, "premium" | "neutro"> = {
  mantenimiento: "neutro",
  renovacion: "premium",
  nota: "neutro",
};

export function RecordatoriosClient({
  recordatorios,
}: {
  recordatorios: RecordatorioConDatos[];
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pendientes = recordatorios.filter((r) => r.estado === "pendiente");
  const resueltos = recordatorios.filter((r) => r.estado !== "pendiente");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Recordatorios</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Mantenimientos y renovaciones se generan solos al entregar una orden de tratamiento.
            También podés anotar algo aparte para tu marca.
          </p>
        </div>
        {!creando && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} />
            Nuevo recordatorio
          </Button>
        )}
      </div>

      {creando && (
        <Card>
          <RecordatorioForm onCancelar={() => setCreando(false)} onGuardado={() => setCreando(false)} />
        </Card>
      )}

      {pendientes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay recordatorios pendientes.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Van a aparecer acá solos cuando entregues una orden de PPF, tratamiento cerámico o
            acrílico.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {pendientes.map((r) =>
            editandoId === r.id ? (
              <EdicionRecordatorio
                key={r.id}
                recordatorio={r}
                onCancelar={() => setEditandoId(null)}
                onGuardado={() => setEditandoId(null)}
              />
            ) : (
              <Card key={r.id} className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm text-texto font-medium truncate">
                    {r.tipo === "nota" ? r.titulo : r.cliente_nombre}
                  </p>
                  <p className="text-xs text-texto-secundario truncate mt-0.5">
                    {r.tipo === "nota"
                      ? r.fecha_proxima
                        ? formatFecha(r.fecha_proxima)
                        : "Sin fecha"
                      : `${r.vehiculo_descripcion || "Sin vehículo"} · ${r.tratamiento} · ${
                          r.fecha_proxima ? formatFecha(r.fecha_proxima) : "Sin fecha"
                        }`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tono={TIPO_TONO[r.tipo]}>{TIPO_LABEL[r.tipo]}</Badge>
                  <button
                    onClick={() => setEditandoId(r.id)}
                    className="text-texto-secundario hover:text-texto"
                    aria-label="Editar fecha"
                  >
                    <Pencil size={14} />
                  </button>
                  {r.tipo !== "nota" && r.cliente_telefono && (
                    <a
                      href={linkWhatsapp(
                        r.cliente_telefono,
                        r.tipo === "mantenimiento"
                          ? mensajeMantenimiento(
                              r.cliente_nombre ?? "",
                              r.tratamiento ?? "tratamiento"
                            )
                          : mensajeRenovacion(
                              r.cliente_nombre ?? "",
                              r.tratamiento ?? "tratamiento",
                              r.vehiculo_descripcion || "tu vehículo"
                            )
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline"
                    >
                      <MessageCircle size={14} />
                      Recontactar
                    </a>
                  )}
                  <button
                    onClick={() =>
                      startTransition(() => cambiarEstadoRecordatorio(r.id, "hecho"))
                    }
                    disabled={isPending}
                    className="text-texto-secundario hover:text-verde disabled:opacity-50"
                    aria-label="Marcar hecho"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm("¿Descartar este recordatorio?")) return;
                      startTransition(() => cambiarEstadoRecordatorio(r.id, "descartado"));
                    }}
                    disabled={isPending}
                    className="text-texto-secundario hover:text-rojo disabled:opacity-50"
                    aria-label="Descartar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {resueltos.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
            Resueltos
          </h2>
          {resueltos.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4 opacity-60">
              <div className="min-w-0">
                <p className="text-sm text-texto truncate">
                  {r.tipo === "nota" ? r.titulo : r.cliente_nombre}
                </p>
                <p className="text-xs text-texto-secundario truncate mt-0.5">
                  {r.tipo !== "nota" && `${r.tratamiento} · `}
                  {r.fecha_proxima ? formatFecha(r.fecha_proxima) : "Sin fecha"}
                </p>
              </div>
              <Badge tono={ESTADO_TONO[r.estado]}>{ESTADO_LABEL[r.estado]}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EdicionRecordatorio({
  recordatorio,
  onCancelar,
  onGuardado,
}: {
  recordatorio: RecordatorioConDatos;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState<EstadoFechaForm, FormData>(
    async (prev, formData) => {
      const resultado = await actualizarRecordatorio(recordatorio.id, prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    {}
  );

  return (
    <Card>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-texto-secundario">Próxima fecha</label>
          <input
            name="fecha_proxima"
            type="date"
            defaultValue={recordatorio.fecha_proxima ?? ""}
            required
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-texto-secundario">Intervalo (meses)</label>
          <input
            name="intervalo_meses"
            type="number"
            min="0"
            defaultValue={recordatorio.intervalo_meses ?? ""}
            className="campo w-32"
          />
        </div>
        {estado.error && <p className="text-xs text-rojo w-full">{estado.error}</p>}
        <div className="flex gap-2">
          <Button type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
