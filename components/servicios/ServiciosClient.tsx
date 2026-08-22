"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ServicioForm } from "./ServicioForm";
import {
  crearServicio,
  actualizarServicio,
  cambiarActivoServicio,
} from "@/app/(app)/servicios/actions";
import type { Servicio } from "@/lib/types/servicio";

export function ServiciosClient({ servicios }: { servicios: Servicio[] }) {
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleActivo = (id: string, activoActual: boolean) => {
    startTransition(() => {
      cambiarActivoServicio(id, !activoActual);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Servicios</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Catálogo con fases, tiempos e intervalos de mantenimiento/renovación.
          </p>
        </div>
        {!creando && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} />
            Nuevo servicio
          </Button>
        )}
      </div>

      {creando && (
        <Card>
          <CardHeader title="Nuevo servicio" />
          <ServicioForm
            accion={crearServicio}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {servicios.length === 0 && !creando && (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">Todavía no hay servicios cargados.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo servicio&quot; para cargar el primero del catálogo.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {servicios.map((s) =>
          editandoId === s.id ? (
            <Card key={s.id}>
              <CardHeader title={`Editar: ${s.nombre}`} />
              <ServicioForm
                servicio={s}
                accion={actualizarServicio.bind(null, s.id)}
                onCancelar={() => setEditandoId(null)}
                onGuardado={() => setEditandoId(null)}
              />
            </Card>
          ) : (
            <Card key={s.id} className={!s.activo ? "opacity-50" : undefined}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base font-semibold text-texto">
                      {s.nombre}
                    </h3>
                    {!s.activo && <Badge tono="neutro">Inactivo</Badge>}
                    {s.tiempo_estimado && (
                      <Badge tono="neutro">{s.tiempo_estimado}</Badge>
                    )}
                    {s.puerta_a_puerta && <Badge tono="neutro">Puerta a puerta</Badge>}
                  </div>
                  {s.descripcion && (
                    <p className="text-sm text-texto-secundario mt-1">{s.descripcion}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {s.fases.map((fase, i) => (
                      <div key={fase} className="flex items-center gap-1.5">
                        <span className="text-xs rounded-full border border-borde bg-panel-2 px-2.5 py-1 text-texto-secundario">
                          {fase}
                        </span>
                        {i < s.fases.length - 1 && (
                          <ChevronRight size={12} className="text-texto-secundario" />
                        )}
                      </div>
                    ))}
                  </div>
                  {(s.mantenimiento_intervalo_meses || s.renovacion_meses) && (
                    <div className="flex gap-4 mt-3 text-xs text-texto-secundario">
                      {s.mantenimiento_intervalo_meses && (
                        <span>Mantenimiento cada {s.mantenimiento_intervalo_meses} meses</span>
                      )}
                      {s.renovacion_meses && (
                        <span>Renovación a los {s.renovacion_meses} meses</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => setEditandoId(s.id)}
                    className="flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActivo(s.id, s.activo)}
                    disabled={isPending}
                    className="text-xs text-texto-secundario hover:text-rojo disabled:opacity-50"
                  >
                    {s.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
