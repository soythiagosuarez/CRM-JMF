"use client";

import { useTransition } from "react";
import { Car, Clock, Wrench, CalendarCheck, MessageCircle, Truck, Tag, StickyNote } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  marcarIngresado,
  cancelarTurno,
  confirmarTurno,
  marcarNoVino,
} from "@/app/(app)/agenda/actions";
import { nombreDiaLargo } from "@/lib/agenda-dates";
import { fechaLarga, textoFranja } from "@/lib/reservas/fechas";
import { linkWhatsapp, mensajeRecordarTurno } from "@/lib/whatsapp";
import { CANAL_LABEL, type CanalReserva } from "@/lib/types/reserva";
import { ESTADO_TURNO_LABEL, type EstadoTurno, type TurnoConDatos } from "@/lib/types/turno";

const estadoTono: Record<EstadoTurno, "neutro" | "positivo" | "negativo" | "premium"> = {
  agendado: "neutro",
  a_confirmar: "premium",
  ingresado: "positivo",
  cancelado: "negativo",
  no_vino: "negativo",
};

export function TurnoPopup({
  turno,
  direccion,
  onCerrar,
}: {
  turno: TurnoConDatos;
  direccion: string;
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const pendiente = turno.estado === "agendado" || turno.estado === "a_confirmar";
  const franja = textoFranja(turno.hora, turno.hora_hasta);
  const primerNombre = turno.cliente_nombre.split(" ")[0];
  const auto = turno.vehiculo_descripcion.split(" · ")[0] || "auto";
  const canal = turno.canal && turno.canal in CANAL_LABEL ? CANAL_LABEL[turno.canal as CanalReserva] : turno.canal;

  const accion = (pregunta: string, fn: () => Promise<void>) => {
    if (!confirm(pregunta)) return;
    startTransition(async () => {
      await fn();
      onCerrar();
    });
  };

  return (
    <Modal titulo={turno.cliente_nombre} onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tono={estadoTono[turno.estado]}>{ESTADO_TURNO_LABEL[turno.estado]}</Badge>
          {turno.origen === "online" && <Badge tono="rojo">Reserva online</Badge>}
          {turno.codigo && <Badge tono="neutro">{turno.codigo}</Badge>}
        </div>

        {turno.estado === "a_confirmar" && (
          <p className="rounded-lg border border-dorado/40 bg-dorado/10 px-3 py-2 text-sm text-texto">
            Eligió un servicio que se define por WhatsApp. Hablá con el cliente y, cuando esté cerrado el precio,
            tocá «Confirmar turno».
          </p>
        )}

        <div className="flex flex-col gap-2 text-sm text-texto-secundario">
          <p className="flex items-center gap-2">
            <Clock size={14} className="shrink-0" />
            {nombreDiaLargo(turno.fecha)} · {turno.hora_hasta ? franja : `${turno.hora.slice(0, 5)} hs`}
          </p>
          {turno.fecha_fin_estimada && turno.fecha_fin_estimada !== turno.fecha && (
            <p className="flex items-center gap-2">
              <CalendarCheck size={14} className="shrink-0" />
              Listo estimado: {fechaLarga(turno.fecha_fin_estimada)}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Car size={14} className="shrink-0" />
            {turno.vehiculo_descripcion || "Sin vehículo"}
          </p>
          <p className="flex items-start gap-2">
            <Wrench size={14} className="shrink-0 mt-0.5" />
            <span>{turno.servicios_nombres.join(" + ")}</span>
          </p>
          {turno.precio_estimado && (
            <p className="flex items-center gap-2">
              <Tag size={14} className="shrink-0" />
              Precio que vio el cliente: <span className="text-texto">{turno.precio_estimado}</span>
            </p>
          )}
          {turno.puerta_a_puerta && (
            <p className="flex items-center gap-2 text-texto">
              <Truck size={14} className="shrink-0" />
              Pidió puerta a puerta (coordinar por WhatsApp)
            </p>
          )}
          {canal && <p className="pl-6">Cómo nos conoció: {canal}</p>}
          {turno.notas && (
            <p className="flex items-start gap-2 text-texto">
              <StickyNote size={14} className="shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{turno.notas}</span>
            </p>
          )}
        </div>

        {pendiente && turno.cliente_telefono && (
          <div className="flex flex-wrap gap-4">
            <a
              href={linkWhatsapp(
                turno.cliente_telefono,
                mensajeRecordarTurno(primerNombre, auto, fechaLarga(turno.fecha), franja, direccion)
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-verde hover:underline"
            >
              <MessageCircle size={14} />
              Recordar turno
            </a>
            <a
              href={linkWhatsapp(turno.cliente_telefono, `Hola ${primerNombre}, te escribimos de JMF Detailing${turno.codigo ? ` por tu reserva ${turno.codigo}` : ""}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-verde hover:underline"
            >
              <MessageCircle size={14} />
              Escribirle
            </a>
          </div>
        )}

        {pendiente && (
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-borde">
            <Button
              variante="fantasma"
              disabled={isPending}
              onClick={() => accion("¿Cancelar este turno?", () => cancelarTurno(turno.id))}
            >
              Cancelar turno
            </Button>
            <Button
              variante="secundario"
              disabled={isPending}
              onClick={() =>
                accion(`¿Confirmás que ${turno.cliente_nombre} no vino? Queda registrado en su ficha.`, () =>
                  marcarNoVino(turno.id)
                )
              }
            >
              No vino
            </Button>
            {turno.estado === "a_confirmar" && (
              <Button
                variante="secundario"
                disabled={isPending}
                onClick={() => accion("¿Confirmar este turno?", () => confirmarTurno(turno.id))}
              >
                Confirmar turno
              </Button>
            )}
            <Button
              disabled={isPending}
              onClick={() =>
                accion(`¿Confirmás que ${turno.cliente_nombre} ingresó al taller?`, () =>
                  marcarIngresado(turno.id)
                )
              }
            >
              Marcar ingresado
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
