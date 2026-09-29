"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck, Truck } from "lucide-react";
import { rangoReservable, type ResultadoDia } from "@/lib/reservas/disponibilidad";
import { aFecha, fechaLarga, horaCorta, lunesDeSemana, nombreMes, sumarDias } from "@/lib/reservas/fechas";
import { ZONAS_PUERTA_A_PUERTA } from "@/lib/reservas/zonas";
import type { DatosAgendaPublica } from "@/lib/types/reserva";
import { Aviso, Seccion } from "./ui";
import type { EstadoReserva } from "./estado";

const DIAS_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

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

export function PasoFecha({
  datos,
  estado,
  disponibilidad,
  actualizar,
}: {
  datos: DatosAgendaPublica;
  estado: EstadoReserva;
  disponibilidad: Map<string, ResultadoDia> | null;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
}) {
  const { desde, hasta } = rangoReservable({ hoy: datos.hoy, config: datos.config });
  const primerDisponible = disponibilidad
    ? [...disponibilidad.entries()].find(([, r]) => r.disponible)?.[0]
    : undefined;
  const [mes, setMes] = useState(() => (estado.fecha ?? primerDisponible ?? desde).slice(0, 7));

  const seleccion = estado.fecha ? disponibilidad?.get(estado.fecha) : undefined;
  const diaElegido = seleccion?.disponible ? seleccion : null;

  const elegirDia = (fecha: string) => {
    const r = disponibilidad?.get(fecha);
    if (!r?.disponible) return;
    // Si hay una sola franja, se elige sola.
    actualizar({ fecha, franja: r.franjas.length === 1 ? r.franjas[0].desde : null });
  };

  return (
    <Seccion titulo="¿Qué día lo traés?" subtitulo="Elegí el día y la franja en la que dejás el auto en el taller.">
      {!primerDisponible && (
        <Aviso tono="premium">
          No encontramos lugar para estos servicios en los próximos {datos.config.anticipacion_max_dias} días.
          Escribinos por WhatsApp y lo coordinamos.
        </Aviso>
      )}

      <div className="rounded-xl border border-borde bg-panel p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setMes(sumarMeses(mes, -1))}
            disabled={mes <= desde.slice(0, 7)}
            className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Mes anterior</span>
          </button>
          <span className="font-display text-base font-semibold text-texto capitalize">
            {nombreMes(`${mes}-01`)}
          </span>
          <button
            type="button"
            onClick={() => setMes(sumarMeses(mes, 1))}
            disabled={mes >= hasta.slice(0, 7)}
            className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto disabled:opacity-30"
          >
            <ChevronRight size={16} />
            <span className="sr-only">Mes siguiente</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_CORTOS.map((d) => (
            <span key={d} className="text-[11px] uppercase tracking-wide text-texto-secundario py-1">
              {d}
            </span>
          ))}
          {semanasDelMes(mes).flat().map((fecha) => {
            const delMes = fecha.slice(0, 7) === mes;
            const enRango = fecha >= desde && fecha <= hasta;
            const r = disponibilidad?.get(fecha);
            const disponible = delMes && !!r?.disponible;
            const elegido = estado.fecha === fecha && disponible;
            return (
              <button
                key={fecha}
                type="button"
                disabled={!disponible}
                onClick={() => elegirDia(fecha)}
                title={delMes && r && !r.disponible ? r.motivo : undefined}
                className={`aspect-square max-h-12 w-full rounded-lg text-sm tabular-nums transition-colors ${
                  !delMes
                    ? "invisible"
                    : elegido
                      ? "bg-rojo text-white font-semibold"
                      : disponible
                        ? "bg-fondo-2 text-texto border border-borde hover:border-rojo"
                        : enRango
                          ? "text-texto-secundario/50 line-through decoration-texto-secundario/40"
                          : "text-texto-secundario/25"
                }`}
              >
                {aFecha(fecha).getUTCDate()}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-texto-secundario">
          Los días tachados no tienen lugar para estos servicios o el taller no recibe autos.
        </p>
      </div>

      {diaElegido && estado.fecha && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-texto">
            Franja para dejar el auto el <span className="font-medium">{fechaLarga(estado.fecha)}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {diaElegido.franjas.map((f) => {
              const elegida = estado.franja === f.desde;
              return (
                <button
                  key={f.desde}
                  type="button"
                  aria-pressed={elegida}
                  onClick={() => actualizar({ franja: f.desde })}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    elegida ? "border-rojo bg-rojo/10" : "border-borde bg-panel hover:border-texto-secundario/60"
                  }`}
                >
                  <span className="block text-sm font-medium text-texto">
                    {f.desde < "12:00" ? "Mañana" : "Tarde"}
                  </span>
                  <span className="block text-xs text-texto-secundario">
                    De {horaCorta(f.desde)} a {horaCorta(f.hasta)} h
                  </span>
                </button>
              );
            })}
          </div>
          <Aviso tono="ok">
            <span className="flex items-start gap-2">
              <CalendarCheck size={16} className="text-verde shrink-0 mt-0.5" />
              {diaElegido.fin === estado.fecha
                ? "Tu auto estaría listo ese mismo día."
                : `Tu auto estaría listo el ${fechaLarga(diaElegido.fin)} (fecha estimada).`}
            </span>
          </Aviso>
        </div>
      )}

      <div className="rounded-xl border border-borde bg-panel px-4 py-3 flex flex-col gap-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={estado.puertaAPuerta}
            onChange={(e) => actualizar({ puertaAPuerta: e.target.checked })}
            className="accent-rojo mt-1"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-texto">
              <Truck size={16} className="text-texto-secundario" /> Quiero el servicio puerta a puerta
            </span>
            <span className="block text-xs text-texto-secundario mt-0.5">
              Buscamos y llevamos tu auto. Día, horario y costo según la zona se coordinan por WhatsApp.
            </span>
          </span>
        </label>
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
    </Seccion>
  );
}
