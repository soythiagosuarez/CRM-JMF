"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, MapPin, MessageCircle } from "lucide-react";
import { fechaLarga, textoFranja } from "@/lib/reservas/fechas";
import { linkWhatsapp, mensajeReservaAJmf } from "@/lib/whatsapp";
import type { ConfigReservas } from "@/lib/types/config";
import type { ReservaConfirmada } from "@/lib/types/reserva";

const SEGUNDOS_REDIRECCION = 5;

/** Abre WhatsApp en la misma pestaña. Embebida en la web de JMF (iframe),
 * intenta navegar la página completa; si el navegador lo bloquea, queda
 * el botón para tocarlo a mano. */
function irAWhatsapp(url: string) {
  try {
    if (window.top && window.top !== window.self) window.top.location.href = url;
    else window.location.href = url;
  } catch {
    // Navegación bloqueada por el navegador: el botón sigue visible.
  }
}

export function ReservaExito({ reserva, config }: { reserva: ReservaConfirmada; config: ConfigReservas }) {
  const [segundos, setSegundos] = useState(SEGUNDOS_REDIRECCION);
  const [quedarse, setQuedarse] = useState(false);
  const aConfirmar = reserva.estado === "a_confirmar";

  const url = linkWhatsapp(
    config.whatsapp,
    mensajeReservaAJmf({
      cliente: reserva.cliente,
      auto: reserva.auto,
      patente: reserva.patente,
      servicio: reserva.servicios,
      dia: fechaLarga(reserva.fecha),
      franja: textoFranja(reserva.franja_desde, reserva.franja_hasta),
      precio: reserva.precio,
      codigo: reserva.codigo,
      aConfirmar,
      puertaAPuerta: reserva.puerta_a_puerta,
    })
  );

  // Respuesta 6.4: a los 5 segundos pasa solo a WhatsApp, con cuenta
  // regresiva visible y la opción de quedarse en la pantalla.
  useEffect(() => {
    if (quedarse) return;
    if (segundos <= 0) {
      irAWhatsapp(url);
      return;
    }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos, quedarse, url]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 size={48} className={aConfirmar ? "text-dorado" : "text-verde"} />
        <div>
          <h2 className="font-display text-2xl font-semibold text-texto">
            {aConfirmar ? "¡Reserva recibida!" : "¡Turno agendado!"}
          </h2>
          <p className="text-sm text-texto-secundario mt-1">
            {aConfirmar
              ? "Tu turno queda a confirmar: te escribimos por WhatsApp para definir el precio final."
              : "Te esperamos en el taller."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-borde bg-panel px-4 py-3 flex flex-col gap-1 text-sm">
        <p className="text-texto">
          <span className="font-medium">{reserva.servicios}</span>
        </p>
        <p className="text-texto-secundario">
          {reserva.auto}
          {reserva.patente ? ` · ${reserva.patente}` : ""}
        </p>
        <p className="text-texto">
          {fechaLarga(reserva.fecha)}, {textoFranja(reserva.franja_desde, reserva.franja_hasta)}
        </p>
        <p className="text-texto-secundario">
          {reserva.fecha_listo === reserva.fecha
            ? "Listo ese mismo día (estimado)"
            : `Listo el ${fechaLarga(reserva.fecha_listo)} (estimado)`}
        </p>
        <p className="text-texto-secundario">Precio aproximado: {reserva.precio}</p>
        <p className="text-texto-secundario">
          Código de reserva: <span className="font-mono text-texto">{reserva.codigo}</span>
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setQuedarse(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-verde px-5 py-3.5 text-base font-semibold text-fondo hover:brightness-110"
      >
        <MessageCircle size={20} />
        Avisar a JMF Detailing
      </a>

      {!quedarse && segundos > 0 && (
        <div className="flex flex-col items-center gap-1 text-sm text-texto-secundario" aria-live="polite">
          <p>
            Te llevamos a WhatsApp en <span className="font-semibold text-texto tabular-nums">{segundos}</span>…
          </p>
          <button
            type="button"
            onClick={() => setQuedarse(true)}
            className="underline underline-offset-2 hover:text-texto"
          >
            Quedarme en esta pantalla
          </button>
        </div>
      )}

      <div className="rounded-xl border border-borde bg-panel-2 px-4 py-3 flex flex-col gap-2 text-sm">
        <p className="font-medium text-texto">Antes de venir</p>
        <p className="flex items-start gap-2 text-texto-secundario">
          <MapPin size={16} className="shrink-0 mt-0.5 text-rojo" />
          <span>
            El taller está en <span className="text-texto">{config.direccion}</span>.
          </span>
        </p>
        {config.indicaciones.map((i) => (
          <p key={i} className="flex items-start gap-2 text-texto-secundario">
            <Info size={16} className="shrink-0 mt-0.5 text-texto-secundario" />
            <span>{i}</span>
          </p>
        ))}
        <p className="text-texto-secundario">
          Si necesitás cambiar o cancelar el turno, escribinos por WhatsApp con uno o dos días de anticipación.
        </p>
      </div>
    </div>
  );
}
