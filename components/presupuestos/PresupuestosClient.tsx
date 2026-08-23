"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeadForm } from "./LeadForm";
import { LeadModal } from "./LeadModal";
import { formatFecha } from "@/lib/format";
import { ESTADO_LEAD_LABEL, ORIGEN_LEAD_LABEL } from "@/lib/types/lead";
import type { LeadConDatos } from "@/lib/types/lead";
import type { ClienteConVehiculos } from "@/lib/types/cliente";
import type { Servicio } from "@/lib/types/servicio";

const ESTADO_TONO = {
  pendiente_presupuesto: "neutro",
  presupuestado: "premium",
  aceptado: "positivo",
  perdido: "negativo",
} as const;

export function PresupuestosClient({
  leads,
  clientes,
  servicios,
}: {
  leads: LeadConDatos[];
  clientes: ClienteConVehiculos[];
  servicios: Servicio[];
}) {
  const [creando, setCreando] = useState(false);
  const [leadAbiertoId, setLeadAbiertoId] = useState<string | null>(null);

  const leadAbierto = leadAbiertoId ? leads.find((l) => l.id === leadAbiertoId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Presupuestos</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Quién consultó, qué se observó y el presupuesto armado con PDF.
          </p>
        </div>
        {!creando && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} />
            Nuevo lead
          </Button>
        )}
      </div>

      {creando && (
        <Card>
          <CardHeader title="Nuevo lead" />
          <LeadForm
            clientes={clientes}
            servicios={servicios}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {leads.length === 0 && !creando ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">Todavía no hay leads cargados.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo lead&quot; para registrar la primera consulta.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {leads.map((l) => (
            <Card
              key={l.id}
              onClick={() => setLeadAbiertoId(l.id)}
              className="flex items-center justify-between gap-4 cursor-pointer hover:border-rojo/40"
            >
              <div className="min-w-0">
                <p className="text-sm text-texto font-medium truncate">{l.cliente_nombre}</p>
                <p className="text-xs text-texto-secundario truncate mt-0.5">
                  {l.servicios_consultados_nombres.join(", ") || "Sin servicios"} ·{" "}
                  {ORIGEN_LEAD_LABEL[l.origen]} · {formatFecha(l.created_at)}
                </p>
              </div>
              <Badge tono={ESTADO_TONO[l.estado]}>{ESTADO_LEAD_LABEL[l.estado]}</Badge>
            </Card>
          ))}
        </div>
      )}

      {leadAbierto && (
        <LeadModal lead={leadAbierto} servicios={servicios} onCerrar={() => setLeadAbiertoId(null)} />
      )}
    </div>
  );
}
