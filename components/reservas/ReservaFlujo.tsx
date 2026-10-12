"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { crearReserva } from "@/app/reservar/actions";
import { calcularDisponibilidad, type ContextoAgenda } from "@/lib/reservas/disponibilidad";
import type { DatosAgendaPublica, ItemReserva, ReservaConfirmada } from "@/lib/types/reserva";
import { textoPrecioTotal } from "@/lib/reservas/precios";
import { PasoDatos } from "./PasoDatos";
import { PasoServicios } from "./PasoServicios";
import { PasoFecha } from "./PasoFecha";
import { PasoConfirmar } from "./PasoConfirmar";
import { ReservaExito } from "./ReservaExito";
import { ResumenLateral } from "./ResumenLateral";
import { Aviso } from "./ui";
import { ESTADO_INICIAL, PASOS, armarInput, validarPaso, type EstadoReserva } from "./estado";

/**
 * Flujo de la agenda online, con la lógica de Calendly:
 * servicios → día y horario → tus datos y tu auto → confirmar →
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
      horaActual: datos.horaActual,
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
      if (!dia?.disponible) return { ...e, items, fecha: null, hora: null };
      return { ...e, items, hora: e.hora && dia.horarios.includes(e.hora) ? e.hora : null };
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
  // Se mide el contenido de la agenda (no el documento: su alto nunca
  // baja del alto actual del iframe, así que solo crecería).
  useEffect(() => {
    const contenido = inicioRef.current;
    if (!embebida || window.parent === window || !contenido) return;
    const avisar = () => {
      const abajo = contenido.getBoundingClientRect().bottom + window.scrollY;
      // + el margen inferior de la página embebida (py-4).
      window.parent.postMessage({ tipo: "jmf-reserva-altura", altura: Math.ceil(abajo + 16) }, "*");
    };
    avisar();
    const observer = new ResizeObserver(avisar);
    observer.observe(contenido);
    return () => observer.disconnect();
  }, [embebida, confirmada]);

  if (confirmada) {
    return (
      <div
        ref={inicioRef}
        className="mx-auto w-full max-w-2xl rounded-2xl border border-borde bg-panel/60 p-4 sm:p-6 scroll-mt-4"
      >
        <ReservaExito reserva={confirmada} config={datos.config} />
      </div>
    );
  }

  const diaElegido = estado.fecha ? disponibilidad?.get(estado.fecha) : undefined;
  const fechaListo = diaElegido?.disponible ? diaElegido.fin : null;
  const esUltimo = indicePaso === PASOS.length - 1;
  const cantidadElegidos = estado.items.length;
  // Mientras falte algo, «Siguiente» queda desactivado (gris) y al lado
  // se dice qué falta, como en el CRM. En el último paso se revisa todo.
  const falta = esUltimo
    ? PASOS.map((p) => validarPaso(p.id, estado, datos.servicios, disponibilidad)).find(Boolean) ?? null
    : validarPaso(paso, estado, datos.servicios, disponibilidad);

  const botonSiguiente = (
    <button
      type="button"
      onClick={esUltimo ? confirmar : siguiente}
      disabled={enviando || !!falta}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rojo px-6 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:border disabled:border-borde disabled:bg-panel-2 disabled:text-texto-secundario disabled:hover:brightness-100"
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
  );

  return (
    <div ref={inicioRef} className="flex flex-col gap-5 scroll-mt-4">
      <ol className="mx-auto grid w-full max-w-xl grid-cols-4 gap-1.5" aria-label="Pasos de la reserva">
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

      {paso === "servicios" ? (
        <div className="rounded-2xl border border-borde bg-panel/60">
          <div className="p-4 sm:p-6">
            <PasoServicios
              servicios={datos.servicios}
              items={estado.items}
              cambiarItems={cambiarItems}
              embebida={embebida}
            />
          </div>
          {/* Cierre de la tarjeta: total elegido y «Siguiente» (en el celular,
              fija abajo de la pantalla mientras se recorre la lista). */}
          <div
            className={`flex flex-col gap-3 rounded-b-2xl border-t border-borde p-4 sm:static sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-6 sm:pb-4 sm:backdrop-blur-none ${
              embebida ? "" : "sticky bottom-0 z-10 bg-fondo-2/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
            }`}
          >
            {error ? (
              <p role="alert" className="text-sm text-rojo">
                {error}
              </p>
            ) : falta && cantidadElegidos > 0 ? (
              <p className="text-sm text-texto-secundario">{falta}</p>
            ) : cantidadElegidos > 0 ? (
              <p className="text-sm text-texto-secundario">
                {cantidadElegidos === 1 ? "1 servicio" : `${cantidadElegidos} servicios`} ·{" "}
                <span className="font-semibold text-texto tabular-nums">
                  {textoPrecioTotal(datos.servicios, estado.items)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-texto-secundario">Elegí el servicio que querés hacerle a tu auto.</p>
            )}
            {botonSiguiente}
          </div>
        </div>
      ) : (
        // Calendario: la tarjeta se ajusta a lo que muestra (crece al aparecer
        // los horarios, como Calendly). Datos y confirmar: ancho fijo.
        <div
          className={`mx-auto grid w-full overflow-hidden rounded-2xl border border-borde bg-panel/60 ${
            paso === "fecha" ? "lg:w-fit lg:grid-cols-[300px_auto]" : "max-w-5xl lg:grid-cols-[300px_1fr]"
          }`}
        >
          <ResumenLateral
            datos={datos}
            estado={estado}
            fechaListo={fechaListo}
            onVolver={() => volverA(indicePaso - 1)}
          />
          <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
            {paso === "fecha" && (
              <PasoFecha
                datos={datos}
                estado={estado}
                disponibilidad={disponibilidad}
                actualizar={actualizar}
                onSiguiente={siguiente}
              />
            )}
            {paso === "datos" && <PasoDatos estado={estado} actualizar={actualizar} />}
            {paso === "confirmar" && (
              <PasoConfirmar
                datos={datos}
                estado={estado}
                fechaListo={fechaListo}
                actualizar={actualizar}
                embebida={embebida}
              />
            )}

            {error && <Aviso tono="error">{error}</Aviso>}

            {paso !== "fecha" && (
              <div className="flex flex-col-reverse gap-3 border-t border-borde pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => volverA(indicePaso - 1)}
                  disabled={enviando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-borde px-4 py-3 text-sm text-texto-secundario hover:text-texto disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Atrás
                </button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  {falta && !error && <p className="text-sm text-texto-secundario sm:text-right">{falta}</p>}
                  {botonSiguiente}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
