"use client";

import { useTransition } from "react";
import { Car, Clock, Wrench } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { marcarIngresado, cancelarTurno } from "@/app/(app)/agenda/actions";
import { nombreDiaLargo } from "@/lib/agenda-dates";
import type { TurnoConDatos } from "@/lib/types/turno";

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

export function TurnoPopup({
  turno,
  onCerrar,
}: {
  turno: TurnoConDatos;
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Modal titulo={turno.cliente_nombre} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge tono={estadoTono[turno.estado]}>{estadoLabel[turno.estado]}</Badge>
        </div>

        <div className="flex flex-col gap-2 text-sm text-texto">
          <p className="flex items-center gap-2 text-texto-secundario">
            <Clock size={14} />
            {nombreDiaLargo(turno.fecha)} · {turno.hora.slice(0, 5)} hs
          </p>
          <p className="flex items-center gap-2 text-texto-secundario">
            <Car size={14} />
            {turno.vehiculo_descripcion || "Sin vehículo"}
          </p>
          <p className="flex items-center gap-2 text-texto-secundario">
            <Wrench size={14} />
            {turno.servicios_nombres.join(", ")}
          </p>
        </div>

        {turno.estado === "agendado" && (
          <div className="flex justify-end gap-2 pt-2 border-t border-borde">
            <Button
              variante="secundario"
              disabled={isPending}
              onClick={() => {
                if (confirm("¿Cancelar este turno?")) {
                  startTransition(async () => {
                    await cancelarTurno(turno.id);
                    onCerrar();
                  });
                }
              }}
            >
              Cancelar turno
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await marcarIngresado(turno.id);
                  onCerrar();
                });
              }}
            >
              Marcar ingresado
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
