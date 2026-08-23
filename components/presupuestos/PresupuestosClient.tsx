"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PresupuestoForm } from "./PresupuestoForm";
import { PresupuestoModal } from "./PresupuestoModal";
import { formatARS, formatFecha } from "@/lib/format";
import { ESTADO_PRESUPUESTO_LABEL } from "@/lib/types/presupuesto";
import type { EstadoPresupuesto, Presupuesto } from "@/lib/types/presupuesto";
import type { Servicio } from "@/lib/types/servicio";

const ESTADO_TONO: Record<EstadoPresupuesto, "neutro" | "positivo" | "negativo"> = {
  pendiente: "neutro",
  aceptado: "positivo",
  rechazado: "negativo",
};

export function PresupuestosClient({
  presupuestos,
  servicios,
}: {
  presupuestos: Presupuesto[];
  servicios: Servicio[];
}) {
  const [creando, setCreando] = useState(false);
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  const abierto = abiertoId ? presupuestos.find((p) => p.id === abiertoId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Presupuestos</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Generador de presupuestos: armá uno y mandalo por WhatsApp. No crea clientes —
            eso se hace en Agenda cuando el cliente acepta.
          </p>
        </div>
        {!creando && (
          <Button onClick={() => setCreando(true)} className="shrink-0 whitespace-nowrap self-start">
            <Plus size={16} />
            Nuevo presupuesto
          </Button>
        )}
      </div>

      {creando && (
        <Card>
          <CardHeader title="Nuevo presupuesto" />
          <PresupuestoForm
            servicios={servicios}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {presupuestos.length === 0 && !creando ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">Todavía no armaste ningún presupuesto.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo presupuesto&quot; para generar el primero.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {presupuestos.map((p) => {
            const total = p.servicios.reduce((acc, s) => acc + s.precio, 0);
            const vehiculo =
              [p.vehiculo_marca, p.vehiculo_modelo].filter(Boolean).join(" ") +
              (p.vehiculo_patente ? ` · ${p.vehiculo_patente}` : "");
            return (
              <Card
                key={p.id}
                onClick={() => setAbiertoId(p.id)}
                className="flex items-center justify-between gap-4 cursor-pointer hover:border-rojo/40"
              >
                <div className="min-w-0">
                  <p className="text-sm text-texto font-medium truncate">{p.nombre_contacto}</p>
                  <p className="text-xs text-texto-secundario truncate mt-0.5">
                    {vehiculo || "Sin vehículo"} · {formatARS(total)} · {formatFecha(p.fecha)}
                  </p>
                </div>
                <Badge tono={ESTADO_TONO[p.estado]}>{ESTADO_PRESUPUESTO_LABEL[p.estado]}</Badge>
              </Card>
            );
          })}
        </div>
      )}

      {abierto && <PresupuestoModal presupuesto={abierto} onCerrar={() => setAbiertoId(null)} />}
    </div>
  );
}
