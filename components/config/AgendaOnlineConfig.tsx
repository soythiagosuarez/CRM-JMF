"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { actualizarConfigReservas, type EstadoConfigForm } from "@/app/(app)/config/actions";
import { formatearWhatsapp } from "@/lib/reservas/config";
import type { EstadoAgendaOnline } from "@/lib/types/reserva";
import { DIAS_SEMANA, DIA_LABEL, resumenFranjas, type ConfigReservas, type Franja } from "@/lib/types/config";

const estadoInicial: EstadoConfigForm = {};

const franjasTexto = (franjas: Franja[]) => franjas.map((f) => `${f.desde}-${f.hasta}`).join(", ");

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(texto)
          .then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          })
          .catch(() => setCopiado(false));
      }}
      className="inline-flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto"
    >
      <Copy size={14} />
      {copiado ? "¡Copiado!" : etiqueta}
    </button>
  );
}

export function AgendaOnlineConfig({
  config,
  urlPublica,
  estadoAgenda,
}: {
  config: ConfigReservas;
  urlPublica: string;
  estadoAgenda: EstadoAgendaOnline;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoConfigForm, formData: FormData) => {
      const resultado = await actualizarConfigReservas(prev, formData);
      if (resultado.ok) setAbierto(false);
      return resultado;
    },
    estadoInicial
  );

  const snippet = `<!-- Botón para la web de JMF Detailing -->
<a href="${urlPublica}" target="_blank" rel="noopener" style="display:inline-block;background:#E8002D;color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;text-decoration:none">Reservá tu turno</a>

<!-- Agenda metida dentro de una página -->
<iframe id="jmf-reservas" src="${urlPublica}?embed=1" title="Reservá tu turno en JMF Detailing" style="width:100%;min-height:900px;border:0"></iframe>
<script>
  window.addEventListener("message", function (e) {
    if (e.data && e.data.tipo === "jmf-reserva-altura") {
      document.getElementById("jmf-reservas").style.height = e.data.altura + "px";
    }
  });
</script>`;

  return (
    <div className="flex flex-col gap-4 text-sm">
      {estadoAgenda.ok ? (
        <p className="flex items-center gap-2 rounded-lg border border-verde/30 bg-verde/10 px-3 py-2 text-texto">
          <CheckCircle2 size={16} className="text-verde shrink-0" />
          La agenda está funcionando: {estadoAgenda.servicios}{" "}
          {estadoAgenda.servicios === 1 ? "servicio disponible" : "servicios disponibles"} para reservar.
        </p>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-rojo/40 bg-rojo/10 px-3 py-2 text-texto" role="alert">
          <AlertTriangle size={16} className="text-rojo shrink-0 mt-0.5" />
          <p>
            <span className="font-medium">La agenda no está funcionando.</span> {estadoAgenda.problema}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-borde bg-panel-2 p-3">
        <p className="text-texto-secundario">Link para compartir (Instagram, WhatsApp Business, Google Maps, QR)</p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="text-texto break-all">{urlPublica}</code>
          <BotonCopiar texto={urlPublica} etiqueta="Copiar link" />
          <a
            href={urlPublica}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto"
          >
            <ExternalLink size={14} /> Abrir
          </a>
        </div>
        <details className="text-xs text-texto-secundario">
          <summary className="cursor-pointer hover:text-texto">Código para la web (botón y agenda embebida)</summary>
          <pre className="mt-2 overflow-x-auto rounded bg-fondo p-3 text-[11px] text-texto">{snippet}</pre>
          <div className="mt-2">
            <BotonCopiar texto={snippet} etiqueta="Copiar código" />
          </div>
        </details>
      </div>

      <div className="flex items-start justify-between gap-3">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <dt className="text-xs text-texto-secundario">WhatsApp de reservas</dt>
            <dd className="text-texto">{formatearWhatsapp(config.whatsapp)}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-secundario">Dirección</dt>
            <dd className="text-texto">{config.direccion}</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-secundario">Lugar en el taller</dt>
            <dd className="text-texto">{config.capacidad_taller} autos a la vez</dd>
          </div>
          <div>
            <dt className="text-xs text-texto-secundario">Se reserva</dt>
            <dd className="text-texto">
              Desde {config.anticipacion_min_dias === 0 ? "hoy" : `${config.anticipacion_min_dias} día(s) antes`} y
              hasta {config.anticipacion_max_dias} días adelante
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-texto-secundario">Franjas de ingreso</dt>
            <dd className="text-texto">
              {resumenFranjas(config.franjas).map((linea) => (
                <p key={linea}>{linea}</p>
              ))}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => setAbierto(true)}
          className="text-texto-secundario hover:text-texto shrink-0"
          aria-label="Editar agenda online"
        >
          <Pencil size={14} />
        </button>
      </div>

      {abierto && (
        <Modal titulo="Editar agenda online" onCerrar={() => setAbierto(false)}>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                WhatsApp de reservas
                <input name="whatsapp" defaultValue={config.whatsapp} className="campo" placeholder="5491169728834" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                Dirección del taller
                <input name="direccion" defaultValue={config.direccion} className="campo" />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
              Lo que el cliente tiene que saber antes de venir (una indicación por línea)
              <textarea
                name="indicaciones"
                rows={3}
                defaultValue={config.indicaciones.join("\n")}
                className="campo resize-none"
              />
            </label>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-texto-secundario">
                Franjas para dejar el auto <span className="text-xs">· ej. 9:00-13:00, 14:00-18:00 · vacío = no se reciben autos</span>
              </p>
              {DIAS_SEMANA.map((dia) => (
                <label key={dia} className="grid grid-cols-[6rem_1fr] items-center gap-2 text-sm text-texto">
                  {DIA_LABEL[dia]}
                  <input name={`franjas_${dia}`} defaultValue={franjasTexto(config.franjas[dia])} className="campo" />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                Autos en el taller a la vez
                <input name="capacidad_taller" type="number" min={1} defaultValue={config.capacidad_taller} className="campo" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                Reservas pendientes por celular
                <input
                  name="max_pendientes_por_celular"
                  type="number"
                  min={1}
                  defaultValue={config.max_pendientes_por_celular}
                  className="campo"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                Días mínimos de anticipación
                <input
                  name="anticipacion_min_dias"
                  type="number"
                  min={0}
                  defaultValue={config.anticipacion_min_dias}
                  className="campo"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-texto-secundario">
                Hasta cuántos días adelante
                <input
                  name="anticipacion_max_dias"
                  type="number"
                  min={1}
                  defaultValue={config.anticipacion_max_dias}
                  className="campo"
                />
              </label>
            </div>

            {estado.error && (
              <p className="text-sm text-rojo" role="alert">
                {estado.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variante="secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
