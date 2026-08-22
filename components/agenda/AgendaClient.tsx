"use client";

import { useState, useTransition } from "react";
import { Plus, Car } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TurnoForm } from "./TurnoForm";
import { marcarIngresado, cancelarTurno } from "@/app/(app)/agenda/actions";
import { formatFecha } from "@/lib/format";
import type { TurnoConDatos } from "@/lib/types/turno";
import type { ClienteConVehiculos } from "@/lib/types/cliente";
import type { Servicio } from "@/lib/types/servicio";

const estadoTono = {
  agendado: "neutro",
  ingresado: "positivo",
  cancelado: "negativo",
} as const;

const estadoLabel = {
  agendado: "Agendado",
  ingresado: "Ingresado",
  cancelado: "Cancelado",
} as const;

export function AgendaClient({
  turnos,
  clientes,
  servicios,
}: {
  turnos: TurnoConDatos[];
  clientes: ClienteConVehiculos[];
  servicios: Servicio[];
}) {
  const [creando, setCreando] = useState(false);
  const [isPending, startTransition] = useTransition();

  const porFecha = new Map<string, TurnoConDatos[]>();
  for (const t of turnos) {
    if (!porFecha.has(t.fecha)) porFecha.set(t.fecha, []);
    porFecha.get(t.fecha)!.push(t);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Agenda</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Turnos de servicio confirmados. Lun a vie 9–18 · Sáb 10–13.
          </p>
        </div>
        {!creando && servicios.length > 0 && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} />
            Nuevo turno
          </Button>
        )}
      </div>

      {servicios.length === 0 && (
        <Card className="text-sm text-texto-secundario">
          Cargá al menos un servicio activo en{" "}
          <a href="/servicios" className="text-rojo hover:underline">
            Servicios
          </a>{" "}
          antes de agendar turnos.
        </Card>
      )}

      {creando && (
        <Card>
          <CardHeader title="Nuevo turno" />
          <TurnoForm
            clientes={clientes}
            servicios={servicios}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {turnos.length === 0 && !creando ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay turnos agendados desde hoy.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo turno&quot; para agendar el primero.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {[...porFecha.entries()].map(([fecha, turnosDelDia]) => (
            <div key={fecha}>
              <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide mb-2">
                {formatFecha(fecha)}
              </h2>
              <div className="flex flex-col gap-2">
                {turnosDelDia.map((t) => (
                  <Card key={t.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-display text-base font-semibold text-texto shrink-0">
                        {t.hora.slice(0, 5)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-texto truncate">{t.cliente_nombre}</p>
                        <p className="text-xs text-texto-secundario flex items-center gap-1.5 truncate">
                          <Car size={12} />
                          {t.vehiculo_descripcion || "Sin vehículo"} ·{" "}
                          {t.servicios_nombres.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge tono={estadoTono[t.estado]}>{estadoLabel[t.estado]}</Badge>
                      {t.estado === "agendado" && (
                        <>
                          <button
                            onClick={() => startTransition(() => marcarIngresado(t.id))}
                            disabled={isPending}
                            className="text-xs text-verde hover:underline disabled:opacity-50"
                          >
                            Marcar ingresado
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("¿Cancelar este turno?")) {
                                startTransition(() => cancelarTurno(t.id));
                              }
                            }}
                            disabled={isPending}
                            className="text-xs text-texto-secundario hover:text-rojo disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
