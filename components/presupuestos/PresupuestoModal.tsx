"use client";

import { useTransition } from "react";
import { FileText, MessageCircle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cambiarEstadoPresupuesto, eliminarPresupuesto } from "@/app/(app)/presupuestos/actions";
import { linkWhatsapp, mensajePresupuesto } from "@/lib/whatsapp";
import { formatARS, formatFecha } from "@/lib/format";
import { ESTADO_PRESUPUESTO_LABEL } from "@/lib/types/presupuesto";
import type { EstadoPresupuesto, Presupuesto } from "@/lib/types/presupuesto";

const ESTADO_TONO: Record<EstadoPresupuesto, "neutro" | "positivo" | "negativo"> = {
  pendiente: "neutro",
  aceptado: "positivo",
  rechazado: "negativo",
};

export function PresupuestoModal({
  presupuesto,
  onCerrar,
}: {
  presupuesto: Presupuesto;
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const vehiculo =
    [presupuesto.vehiculo_marca, presupuesto.vehiculo_modelo].filter(Boolean).join(" ") +
    (presupuesto.vehiculo_patente ? ` · ${presupuesto.vehiculo_patente}` : "");
  const total = presupuesto.servicios.reduce((acc, s) => acc + s.precio, 0);

  const borrar = () => {
    if (!confirm(`¿Eliminar el presupuesto de ${presupuesto.nombre_contacto}? No se puede deshacer.`))
      return;
    startTransition(async () => {
      await eliminarPresupuesto(presupuesto.id);
      onCerrar();
    });
  };

  return (
    <Modal titulo={presupuesto.nombre_contacto} onCerrar={onCerrar}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tono={ESTADO_TONO[presupuesto.estado]}>
              {ESTADO_PRESUPUESTO_LABEL[presupuesto.estado]}
            </Badge>
            {vehiculo && <Badge tono="neutro">{vehiculo}</Badge>}
          </div>
          <button
            onClick={borrar}
            disabled={isPending}
            className="text-texto-secundario hover:text-rojo disabled:opacity-50"
            aria-label="Eliminar presupuesto"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {presupuesto.que_observo && (
          <p className="text-sm text-texto-secundario">Observado: {presupuesto.que_observo}</p>
        )}

        <div className="rounded-lg border border-borde bg-panel-2 p-3 flex flex-col gap-1.5">
          {presupuesto.servicios.map((s, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-texto">{s.nombre}</span>
              <span className="text-texto-secundario">{formatARS(s.precio)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-medium pt-1.5 border-t border-borde mt-1">
            <span className="text-texto">Total</span>
            <span className="text-rojo">{formatARS(total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-texto-secundario">
          {presupuesto.tiempo_estimado && <span>Tiempo estimado: {presupuesto.tiempo_estimado}</span>}
          {presupuesto.validez && <span>Válido hasta {formatFecha(presupuesto.validez)}</span>}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/presupuestos/${presupuesto.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variante="secundario">
              <FileText size={14} />
              Ver PDF
            </Button>
          </a>
          {presupuesto.telefono && (
            <a
              href={linkWhatsapp(
                presupuesto.telefono,
                mensajePresupuesto({
                  nombreContacto: presupuesto.nombre_contacto,
                  vehiculo: vehiculo || "vehículo",
                  queObservo: presupuesto.que_observo,
                  servicios: presupuesto.servicios,
                  tiempoEstimado: presupuesto.tiempo_estimado,
                  validez: presupuesto.validez,
                  formatARS,
                  formatFecha,
                })
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                <MessageCircle size={14} />
                Enviar por WhatsApp
              </Button>
            </a>
          )}
        </div>

        {presupuesto.estado === "pendiente" && (
          <div className="flex gap-2 border-t border-borde pt-4">
            <Button
              variante="secundario"
              disabled={isPending}
              onClick={() =>
                startTransition(() => cambiarEstadoPresupuesto(presupuesto.id, "rechazado"))
              }
            >
              Marcar rechazado
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(() => cambiarEstadoPresupuesto(presupuesto.id, "aceptado"))
              }
            >
              Marcar aceptado
            </Button>
          </div>
        )}

        {presupuesto.estado === "aceptado" && (
          <p className="text-xs text-texto-secundario border-t border-borde pt-4">
            Cuando coordines día y hora con {presupuesto.nombre_contacto}, cargá el turno en
            Agenda.
          </p>
        )}
      </div>
    </Modal>
  );
}
