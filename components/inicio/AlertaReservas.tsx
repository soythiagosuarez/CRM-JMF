"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CalendarPlus, X } from "lucide-react";
import { marcarReservaRevisada } from "@/app/(app)/agenda/actions";
import { fechaLarga, textoFranja } from "@/lib/reservas/fechas";
import type { TurnoConDatos } from "@/lib/types/turno";

/**
 * Aviso dentro del CRM cada vez que alguien reserva por la agenda online
 * (respuesta 6.5), igual que las alertas de Recordatorios: queda hasta
 * que Joaco la cierra o gestiona el turno.
 */
export function AlertaReservas({ reservas }: { reservas: TurnoConDatos[] }) {
  const [isPending, startTransition] = useTransition();

  if (reservas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {reservas.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-rojo/40 bg-rojo/10 px-4 py-3"
        >
          <div className="flex items-start gap-2 text-sm text-texto min-w-0">
            <CalendarPlus size={16} className="text-rojo shrink-0 mt-0.5" />
            <p className="min-w-0">
              <span className="font-medium">Nueva reserva online{t.estado === "a_confirmar" ? " (a confirmar)" : ""}:</span>{" "}
              {t.cliente_nombre} · {t.servicios_nombres.join(" + ")} · {fechaLarga(t.fecha)},{" "}
              {textoFranja(t.hora, t.hora_hasta)}
              {t.puerta_a_puerta ? " · puerta a puerta" : ""}{" "}
              <Link href={`/agenda?vista=dia&fecha=${t.fecha}`} className="text-rojo hover:underline whitespace-nowrap">
                Ver en Agenda
              </Link>
            </p>
          </div>
          <button
            onClick={() => startTransition(() => marcarReservaRevisada(t.id))}
            disabled={isPending}
            className="text-texto-secundario hover:text-texto disabled:opacity-50 shrink-0"
            aria-label="Marcar como vista"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
