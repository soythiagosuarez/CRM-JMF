"use client";

import { useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Globe, Truck, Check } from "lucide-react";
import { rangoReservable, type ResultadoDia } from "@/lib/reservas/disponibilidad";
import { aFecha, fechaLarga, horaCorta, lunesDeSemana, nombreMes, sumarDias } from "@/lib/reservas/fechas";
import { ZONAS_PUERTA_A_PUERTA } from "@/lib/reservas/zonas";
import type { DatosAgendaPublica } from "@/lib/types/reserva";
import { Aviso } from "./ui";
import type { EstadoReserva } from "./estado";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function sumarMeses(mes: string, cantidad: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + cantidad, 1));
  return d.toISOString().slice(0, 7);
}

function semanasDelMes(mes: string): string[][] {
  const primero = `${mes}-01`;
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const semanas: string[][] = [];
  let lunes = lunesDeSemana(primero);
  while (lunes <= ultimo) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)));
    lunes = sumarDias(lunes, 7);
  }
  return semanas;
}

/**
 * Día y horario, como Calendly: el calendario marca con un círculo los
 * días con lugar para los servicios elegidos (según la agenda del CRM);
 * al tocar un día aparecen sus horarios a la derecha, y al elegir uno
 * aparece «Siguiente» al lado.
 */
export function PasoFecha({
  datos,
  estado,
  disponibilidad,
  actualizar,
  onSiguiente,
}: {
  datos: DatosAgendaPublica;
  estado: EstadoReserva;
  disponibilidad: Map<string, ResultadoDia> | null;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
  onSiguiente: () => void;
}) {
  const { desde, hasta } = rangoReservable({ hoy: datos.hoy, config: datos.config });
  const primerDisponible = disponibilidad
    ? [...disponibilidad.entries()].find(([, r]) => r.disponible)?.[0]
    : undefined;
  const [mes, setMes] = useState(() => (estado.fecha ?? primerDisponible ?? desde).slice(0, 7));
  const horariosRef = useRef<HTMLDivElement>(null);

  const seleccion = estado.fecha ? disponibilidad?.get(estado.fecha) : undefined;
  const diaElegido = seleccion?.disponible ? seleccion : null;

  const elegirDia = (fecha: string) => {
    const r = disponibilidad?.get(fecha);
    if (!r?.disponible) return;
    const hora = estado.hora && r.horarios.includes(estado.hora) ? estado.hora : null;
    actualizar({ fecha, hora });
    // En el celular los horarios quedan abajo del calendario: los mostramos.
    if (window.matchMedia("(max-width: 639px)").matches) {
      requestAnimationFrame(() => horariosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-lg sm:text-xl font-semibold text-texto">Elegí el día y el horario</h2>

      {!primerDisponible && (
        <Aviso tono="premium">
          No encontramos lugar para estos servicios en los próximos {datos.config.anticipacion_max_dias} días.
          Escribinos por WhatsApp y lo coordinamos.
        </Aviso>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-full sm:max-w-sm sm:flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-medium text-texto capitalize">{nombreMes(`${mes}-01`)}</span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMes(sumarMeses(mes, -1))}
                disabled={mes <= desde.slice(0, 7)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-rojo hover:bg-rojo/10 disabled:text-texto-secundario/30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={18} />
                <span className="sr-only">Mes anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setMes(sumarMeses(mes, 1))}
                disabled={mes >= hasta.slice(0, 7)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-rojo hover:bg-rojo/10 disabled:text-texto-secundario/30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={18} />
                <span className="sr-only">Mes siguiente</span>
              </button>
            </span>
          </div>

          <div className="grid grid-cols-7 gap-y-1.5 text-center">
            {DIAS_CORTOS.map((d) => (
              <span key={d} className="pb-1 text-[11px] font-medium uppercase text-texto-secundario">
                {d}
              </span>
            ))}
            {semanasDelMes(mes).flat().map((fecha) => {
              const delMes = fecha.slice(0, 7) === mes;
              const r = disponibilidad?.get(fecha);
              const disponible = delMes && !!r?.disponible;
              const elegido = estado.fecha === fecha && disponible;
              return (
                <span key={fecha} className="flex justify-center">
                  <button
                    type="button"
                    disabled={!disponible}
                    onClick={() => elegirDia(fecha)}
                    aria-pressed={elegido}
                    title={delMes && r && !r.disponible ? r.motivo : undefined}
                    className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                      !delMes
                        ? "invisible"
                        : elegido
                          ? "bg-rojo font-semibold text-white"
                          : disponible
                            ? "bg-rojo/15 font-semibold text-rojo hover:bg-rojo/25"
                            : "text-texto-secundario/45"
                    }`}
                  >
                    {aFecha(fecha).getUTCDate()}
                    {fecha === datos.hoy && delMes && (
                      <span
                        className={`absolute bottom-1.5 h-1 w-1 rounded-full ${elegido ? "bg-white" : "bg-texto-secundario"}`}
                      />
                    )}
                  </button>
                </span>
              );
            })}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-texto-secundario">
            <Globe size={14} className="shrink-0" />
            Hora de Argentina (GMT-3)
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => actualizar({ puertaAPuerta: !estado.puertaAPuerta })}
              aria-pressed={estado.puertaAPuerta}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                estado.puertaAPuerta ? "border-rojo bg-rojo/10" : "border-borde bg-panel hover:border-texto-secundario/60"
              }`}
            >
              <Truck size={20} className={estado.puertaAPuerta ? "text-rojo shrink-0" : "text-texto-secundario shrink-0"} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-texto">Quiero el servicio puerta a puerta</span>
                <span className="block text-xs text-texto-secundario">
                  Buscamos y llevamos tu auto. Horario y costo según la zona, por WhatsApp.
                </span>
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  estado.puertaAPuerta ? "border-rojo bg-rojo text-white" : "border-texto-secundario/50"
                }`}
                aria-hidden
              >
                {estado.puertaAPuerta && <Check size={13} strokeWidth={3} />}
              </span>
            </button>
            <details className="text-xs text-texto-secundario">
              <summary className="cursor-pointer hover:text-texto">Ver zonas que cubrimos (zona norte del GBA)</summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {ZONAS_PUERTA_A_PUERTA.map((z) => (
                  <li key={z.partido}>
                    <span className="text-texto">{z.partido}:</span> {z.localidades}.
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>

        {diaElegido && estado.fecha && (
          <div ref={horariosRef} className="w-full sm:w-52 lg:w-56 shrink-0 scroll-mt-4">
            <p className="mb-3 font-medium text-texto first-letter:uppercase">{fechaLarga(estado.fecha)}</p>
            <div className="flex flex-col gap-2 sm:max-h-[26rem] sm:overflow-y-auto sm:pr-1">
              {diaElegido.horarios.map((h) =>
                estado.hora === h ? (
                  <div key={h} className="grid grid-cols-2 gap-2">
                    <span className="flex items-center justify-center rounded-lg bg-texto-secundario/80 py-3 text-sm font-semibold text-fondo tabular-nums">
                      {horaCorta(h)}
                    </span>
                    <button
                      type="button"
                      onClick={onSiguiente}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rojo py-3 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Siguiente
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    key={h}
                    type="button"
                    onClick={() => actualizar({ hora: h })}
                    className="rounded-lg border border-rojo/50 py-3 text-sm font-semibold text-rojo tabular-nums hover:border-rojo hover:bg-rojo/5"
                  >
                    {horaCorta(h)}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

    </section>
  );
}
