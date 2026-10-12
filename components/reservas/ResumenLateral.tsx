"use client";

import { ArrowLeft, CalendarDays, Clock, MapPin, Truck, Wallet } from "lucide-react";
import { jornadasItems } from "@/lib/reservas/disponibilidad";
import { fechaLarga, horaCorta } from "@/lib/reservas/fechas";
import { nombreItem, textoPrecioTotal } from "@/lib/reservas/precios";
import type { DatosAgendaPublica } from "@/lib/types/reserva";
import type { EstadoReserva } from "./estado";

/**
 * Panel izquierdo de la tarjeta (como Calendly): lo elegido hasta ahora,
 * cuánto tarda, dónde es y cuándo. En el celular queda arriba.
 */
export function ResumenLateral({
  datos,
  estado,
  fechaListo,
  onVolver,
}: {
  datos: DatosAgendaPublica;
  estado: EstadoReserva;
  fechaListo: string | null;
  onVolver: () => void;
}) {
  const servicioDe = (id: string) => datos.servicios.find((s) => s.id === id);
  const jornadas = jornadasItems(estado.items, datos.servicios);

  return (
    <aside className="flex flex-col gap-4 border-b border-borde p-4 sm:p-6 lg:border-b-0 lg:border-r">
      <div>
        <button
          type="button"
          onClick={onVolver}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-borde text-rojo hover:bg-rojo/10"
        >
          <ArrowLeft size={18} />
          <span className="sr-only">Volver al paso anterior</span>
        </button>
      </div>

      <div>
        <p className="text-sm text-texto-secundario">JMF Detailing</p>
        <ul className="mt-1 flex flex-col gap-1">
          {estado.items.map((i) => {
            const s = servicioDe(i.servicio_id);
            return s ? (
              <li key={i.servicio_id} className="font-display text-lg sm:text-xl font-semibold leading-snug text-texto">
                {nombreItem(s, i)}
              </li>
            ) : null;
          })}
        </ul>
      </div>

      <ul className="flex flex-col gap-2.5 text-sm text-texto-secundario">
        <li className="flex items-start gap-2.5">
          <Clock size={18} className="mt-px shrink-0" />
          <span>
            {fechaListo && estado.fecha
              ? fechaListo === estado.fecha
                ? "Listo el mismo día (estimado)"
                : `Listo el ${fechaLarga(fechaListo)} (estimado)`
              : jornadas === 1
                ? "Se hace en 1 día de taller"
                : `Se hace en ${jornadas} días de taller`}
          </span>
        </li>
        {estado.fecha && estado.hora && (
          <li className="flex items-start gap-2.5 text-texto">
            <CalendarDays size={18} className="mt-px shrink-0 text-texto-secundario" />
            <span>
              {horaCorta(estado.hora)} hs, {fechaLarga(estado.fecha)}
            </span>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <MapPin size={18} className="mt-px shrink-0" />
          <span>{datos.config.direccion}</span>
        </li>
        {estado.puertaAPuerta && (
          <li className="flex items-start gap-2.5">
            <Truck size={18} className="mt-px shrink-0" />
            <span>Puerta a puerta (lo coordinamos por WhatsApp)</span>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <Wallet size={18} className="mt-px shrink-0" />
          <span className="tabular-nums">{textoPrecioTotal(datos.servicios, estado.items)}</span>
        </li>
      </ul>
    </aside>
  );
}
