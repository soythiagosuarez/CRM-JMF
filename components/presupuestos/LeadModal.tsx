"use client";

import { useActionState, useTransition } from "react";
import { FileText, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  guardarPresupuesto,
  aceptarLead,
  marcarPerdido,
  type EstadoPresupuestoForm,
  type EstadoAceptarForm,
} from "@/app/(app)/presupuestos/actions";
import { linkWhatsapp } from "@/lib/whatsapp";
import { formatARS, formatFecha } from "@/lib/format";
import { ESTADO_LEAD_LABEL, ORIGEN_LEAD_LABEL } from "@/lib/types/lead";
import type { LeadConDatos } from "@/lib/types/lead";
import type { Servicio } from "@/lib/types/servicio";

const ESTADO_TONO = {
  pendiente_presupuesto: "neutro",
  presupuestado: "premium",
  aceptado: "positivo",
  perdido: "negativo",
} as const;

export function LeadModal({
  lead,
  servicios,
  onCerrar,
}: {
  lead: LeadConDatos;
  servicios: Servicio[];
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const vehiculo =
    [lead.datos_vehiculo.marca, lead.datos_vehiculo.modelo].filter(Boolean).join(" ") +
    (lead.datos_vehiculo.patente ? ` · ${lead.datos_vehiculo.patente}` : "");

  return (
    <Modal titulo={lead.cliente_nombre} onCerrar={onCerrar}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tono={ESTADO_TONO[lead.estado]}>{ESTADO_LEAD_LABEL[lead.estado]}</Badge>
          <Badge tono="neutro">{ORIGEN_LEAD_LABEL[lead.origen]}</Badge>
          <Badge tono="neutro">{vehiculo || "Sin vehículo"}</Badge>
        </div>

        {lead.que_observo && (
          <p className="text-sm text-texto-secundario">Observado: {lead.que_observo}</p>
        )}

        <p className="text-sm text-texto-secundario">
          Servicios consultados: {lead.servicios_consultados_nombres.join(", ") || "—"}
        </p>

        {lead.estado === "pendiente_presupuesto" && (
          <PresupuestoForm leadId={lead.id} servicioIds={lead.servicios_consultados} servicios={servicios} />
        )}

        {lead.presupuesto && (
          <div className="rounded-lg border border-borde bg-panel-2 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-texto-secundario">
                Presupuesto · válido hasta {formatFecha(lead.presupuesto.validez)}
              </p>
              <a
                href={`/api/presupuestos/${lead.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-rojo hover:underline"
              >
                <FileText size={14} />
                Ver PDF
              </a>
            </div>
            <p className="text-sm text-texto">
              Total:{" "}
              {formatARS(lead.presupuesto.servicios.reduce((acc, s) => acc + s.precio, 0))} ·{" "}
              {lead.presupuesto.tiempo_estimado}
            </p>
            {lead.cliente_telefono && (
              <a
                href={linkWhatsapp(
                  lead.cliente_telefono,
                  `Hola ${lead.cliente_nombre}, te compartimos el presupuesto para tu ${vehiculo || "vehículo"}. Cualquier consulta quedamos a disposición. — JMF Detailing`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline self-start"
              >
                <MessageCircle size={14} />
                Avisar por WhatsApp
              </a>
            )}
          </div>
        )}

        {lead.estado === "presupuestado" && <AceptarForm leadId={lead.id} />}

        {(lead.estado === "pendiente_presupuesto" || lead.estado === "presupuestado") && (
          <Button
            variante="secundario"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`¿Marcar este lead como perdido?`)) return;
              startTransition(() => marcarPerdido(lead.id));
            }}
            className="self-start"
          >
            Marcar perdido
          </Button>
        )}
      </div>
    </Modal>
  );
}

function PresupuestoForm({
  leadId,
  servicioIds,
  servicios,
}: {
  leadId: string;
  servicioIds: string[];
  servicios: Servicio[];
}) {
  const [estado, formAction, enviando] = useActionState<EstadoPresupuestoForm, FormData>(
    guardarPresupuesto.bind(null, leadId, servicioIds),
    {}
  );
  const nombreServicio = new Map(servicios.map((s) => [s.id, s.nombre]));

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-borde pt-4">
      <p className="text-sm text-texto-secundario">Armar presupuesto</p>
      {servicioIds.map((id) => (
        <div key={id} className="flex items-center gap-3">
          <span className="text-sm text-texto flex-1">{nombreServicio.get(id) ?? "Servicio"}</span>
          <input
            name={`precio_${id}`}
            type="number"
            min="0"
            placeholder="Precio"
            required
            className="campo w-32"
          />
        </div>
      ))}
      <input name="tiempo_estimado" placeholder="Tiempo estimado (ej. 5 días)" required className="campo" />
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando..." : "Guardar presupuesto"}
      </Button>
    </form>
  );
}

function AceptarForm({ leadId }: { leadId: string }) {
  const [estado, formAction, enviando] = useActionState<EstadoAceptarForm, FormData>(
    aceptarLead.bind(null, leadId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-borde pt-4">
      <p className="text-sm text-texto-secundario">
        Aceptar y agendar turno — Lun a vie 9–18 · Sáb 10–13
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input name="fecha" type="date" required className="campo" />
        <input name="hora" type="time" required className="campo" />
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Agendando..." : "Aceptar y agendar turno"}
      </Button>
    </form>
  );
}
