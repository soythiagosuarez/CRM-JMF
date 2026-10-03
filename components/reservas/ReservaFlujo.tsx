"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { crearReserva } from "@/app/reservar/actions";
import { calcularDisponibilidad, type ContextoAgenda } from "@/lib/reservas/disponibilidad";
import type { DatosAgendaPublica, ItemReserva, ReservaConfirmada } from "@/lib/types/reserva";
import { PasoCliente } from "./PasoCliente";
import { PasoAuto } from "./PasoAuto";
import { PasoServicios } from "./PasoServicios";
import { PasoFecha } from "./PasoFecha";
import { PasoConfirmar } from "./PasoConfirmar";
import { ReservaExito } from "./ReservaExito";
import { Aviso } from "./ui";
import { ESTADO_INICIAL, PASOS, armarInput, validarPaso, type EstadoReserva } from "./estado";

/**
 * Flujo de la agenda online (relevamiento con Joaco):
 * cliente nuevo/actual → auto → servicios → día y franja → confirmar →
 * pantalla de turno agendado con aviso por WhatsApp.
 */
export function ReservaFlujo({ datos, embebida }: { datos: DatosAgendaPublica; embebida: boolean }) {
  const [estado, setEstado] = useState<EstadoReserva>(ESTADO_INICIAL);
  const [indicePaso, setIndicePaso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<ReservaConfirmada | null>(null);
  const [enviando, startEnvio] = useTransition();
  const inicioRef = useRef<HTMLDivElement>(null);

  const paso = PASOS[indicePaso].id;

  const ctx: ContextoAgenda = useMemo(
    () => ({
      hoy: datos.hoy,
      config: datos.config,
      servicios: datos.servicios,
      ocupaciones: datos.ocupaciones,
      bloqueos: datos.bloqueos,
    }),
    [datos]
  );

  const disponibilidad = useMemo(
    () => (estado.items.length > 0 ? calcularDisponibilidad(estado.items, ctx) : null),
    [estado.items, ctx]
  );

  const actualizar = (cambios: Partial<EstadoReserva>) => {
    setError(null);
    setEstado((e) => ({ ...e, ...cambios }));
  };

  /** Al cambiar servicios, si el día elegido deja de tener lugar se borra. */
  const cambiarItems = (items: ItemReserva[]) => {
    setError(null);
    setEstado((e) => {
      if (!e.fecha) return { ...e, items };
      const dia = items.length > 0 ? calcularDisponibilidad(items, ctx).get(e.fecha) : undefined;
      const sigue = dia?.disponible && dia.franjas.some((f) => f.desde === e.franja);
      return sigue ? { ...e, items } : { ...e, items, fecha: null, franja: null };
    });
  };

  const irAlInicio = () => inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const siguiente = () => {
    const falta = validarPaso(paso, estado, datos.servicios, disponibilidad);
    if (falta) {
      setError(falta);
      return;
    }
    setError(null);
    setIndicePaso((i) => Math.min(i + 1, PASOS.length - 1));
    irAlInicio();
  };

  const volverA = (indice: number) => {
    setError(null);
    setIndicePaso(indice);
    irAlInicio();
  };

  const confirmar = () => {
    for (const p of PASOS) {
      const falta = validarPaso(p.id, estado, datos.servicios, disponibilidad);
      if (falta) {
        setError(falta);
        return;
      }
    }
    startEnvio(async () => {
      const r = await crearReserva(armarInput(estado));
      if (r.ok) {
        setConfirmada(r.reserva);
        irAlInicio();
      } else {
        setError(r.error);
      }
    });
  };

  // Embebida en la web: le avisa a la página contenedora el alto, para
  // que el iframe crezca con el contenido (ver snippet en Config).
  useEffect(() => {
    if (!embebida || window.parent === window) return;
    const avisar = () =>
      window.parent.postMessage(
        { tipo: "jmf-reserva-altura", altura: document.documentElement.scrollHeight },
        "*"
      );
    avisar();
    const observer = new ResizeObserver(avisar);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [embebida]);

  if (confirmada) {
    return (
      <div ref={inicioRef} className="rounded-2xl border border-borde bg-panel/60 p-4 sm:p-6 scroll-mt-4">
        <ReservaExito reserva={confirmada} config={datos.config} />
      </div>
    );
  }

  const diaElegido = estado.fecha ? disponibilidad?.get(estado.fecha) : undefined;
  const franjaElegida =
    diaElegido?.disponible ? (diaElegido.franjas.find((f) => f.desde === estado.franja) ?? null) : null;
  const esUltimo = indicePaso === PASOS.length - 1;

  return (
    <div ref={inicioRef} className="flex flex-col gap-5 scroll-mt-4">
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Pasos de la reserva">
        {PASOS.map((p, i) => {
          const hecho = i < indicePaso;
          const actual = i === indicePaso;
          return (
            <li key={p.id} className="flex flex-col gap-1.5 min-w-0">
              <button
                type="button"
                disabled={!hecho}
                onClick={() => volverA(i)}
                className="flex flex-col gap-1.5 text-left disabled:cursor-default"
                aria-current={actual ? "step" : undefined}
              >
                <span
                  className={`h-1 rounded-full ${hecho ? "bg-rojo" : actual ? "bg-rojo/60" : "bg-panel-2"}`}
                />
                <span
                  className={`text-[11px] sm:text-xs truncate ${
                    actual ? "text-texto font-medium" : hecho ? "text-texto-secundario hover:text-texto" : "text-texto-secundario/60"
                  }`}
                >
                  {p.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="rounded-2xl border border-borde bg-panel/60 p-4 sm:p-6">
        {paso === "cliente" && <PasoCliente estado={estado} actualizar={actualizar} />}
        {paso === "auto" && <PasoAuto estado={estado} actualizar={actualizar} />}
        {paso === "servicios" && (
          <PasoServicios servicios={datos.servicios} items={estado.items} cambiarItems={cambiarItems} />
        )}
        {paso === "fecha" && (
          <PasoFecha datos={datos} estado={estado} disponibilidad={disponibilidad} actualizar={actualizar} />
        )}
        {paso === "confirmar" && (
          <PasoConfirmar
            datos={datos}
            estado={estado}
            franja={franjaElegida}
            fechaListo={diaElegido?.disponible ? diaElegido.fin : null}
            actualizar={actualizar}
            embebida={embebida}
          />
        )}
      </div>

      {error && <Aviso tono="error">{error}</Aviso>}

      <div className="flex items-center justify-between gap-3">
        {indicePaso > 0 ? (
          <button
            type="button"
            onClick={() => volverA(indicePaso - 1)}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-xl border border-borde px-4 py-3 text-sm text-texto-secundario hover:text-texto disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={esUltimo ? confirmar : siguiente}
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-xl bg-rojo px-6 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {enviando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Reservando…
            </>
          ) : esUltimo ? (
            "Confirmar reserva"
          ) : (
            <>
              Siguiente
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
