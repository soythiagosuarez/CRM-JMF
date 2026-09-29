"use client";

import { useActionState, useState, useTransition } from "react";
import { Gift, Star, Check, Plus, Minus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Monto } from "@/components/ui/Monto";
import { BotonAvisarPremio } from "./BotonAvisarPremio";
import {
  ajustarPuntos,
  canjearPremio,
  marcarCanjeUsado,
  responderAviso,
  type EstadoFidelizacionForm,
} from "@/app/(app)/clientes/fidelizacion/actions";
import { premiosActivos } from "@/lib/fidelizacion/reglas";
import { formatARS, formatFecha } from "@/lib/format";
import { MOTIVO_PUNTOS_LABEL, type ConfigFidelizacion, type MotivoPuntos } from "@/lib/types/config";
import {
  RESPUESTA_AVISO_LABEL,
  type AvisoFidelizacion,
  type MovimientoPuntos,
  type Premio,
  type ResumenFidelizacion,
} from "@/lib/types/fidelizacion";

export function FidelizacionCard({
  cliente,
  resumen,
  movimientos,
  avisos,
  premios,
  config,
}: {
  cliente: { id: string; nombre: string; telefono: string | null };
  resumen: ResumenFidelizacion;
  movimientos: MovimientoPuntos[];
  avisos: AvisoFidelizacion[];
  premios: Premio[];
  config: ConfigFidelizacion;
}) {
  const [isPending, startTransition] = useTransition();
  const [premioElegido, setPremioElegido] = useState("");
  const [errorCanje, setErrorCanje] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);

  const activos = premiosActivos(premios);
  const proximo = activos.find((p) => p.puntos > resumen.saldo);
  const aviso = resumen.ultimo_aviso;
  const esperandoRespuesta = aviso && !aviso.respuesta;
  const canjesPendientes = movimientos.filter((m) => m.tipo === "canje" && m.canje_estado === "pendiente");
  const nombresPremios = resumen.premios_disponibles.map((p) => p.nombre);

  const canjear = () => {
    if (!premioElegido) return;
    const premio = activos.find((p) => p.id === premioElegido);
    if (!premio || !confirm(`¿Canjear «${premio.nombre}» por ${premio.puntos} puntos?`)) return;
    setErrorCanje(null);
    startTransition(async () => {
      const r = await canjearPremio(cliente.id, premioElegido);
      if (r.error) setErrorCanje(r.error);
      else setPremioElegido("");
    });
  };

  return (
    <Card>
      <CardHeader
        title="Fidelización"
        subtitle={`1 punto cada ${formatARS(config.pesos_por_punto)} cobrados en servicios básicos`}
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-dorado/30 bg-dorado/10 p-3">
          <p className="text-xs text-texto-secundario">Puntos</p>
          <p className="font-display text-2xl font-semibold text-dorado tabular-nums">{resumen.saldo}</p>
        </div>
        <div className="rounded-lg border border-borde bg-panel-2 p-3">
          <p className="text-xs text-texto-secundario">Total gastado</p>
          <p className="font-display text-2xl font-semibold text-texto tabular-nums">
            <Monto valor={resumen.total_gastado} />
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        {resumen.premios_disponibles.length > 0 ? (
          <div className="rounded-lg border border-borde bg-panel-2 p-3 flex flex-col gap-2">
            <p className="flex items-start gap-2 text-texto">
              <Gift size={16} className="text-dorado shrink-0 mt-0.5" />
              <span>Puede canjear: {nombresPremios.join(", ")}.</span>
            </p>
            {(resumen.estado_aviso === "avisar" || resumen.estado_aviso === "reavisar") && (
              <BotonAvisarPremio
                clienteId={cliente.id}
                nombre={cliente.nombre}
                telefono={cliente.telefono}
                saldo={resumen.saldo}
                premios={nombresPremios}
                reaviso={resumen.estado_aviso === "reavisar"}
              />
            )}
          </div>
        ) : (
          <p className="text-texto-secundario">
            {proximo
              ? `Le faltan ${proximo.puntos - resumen.saldo} puntos para «${proximo.nombre}».`
              : "No hay premios activos cargados."}
          </p>
        )}

        {esperandoRespuesta && (
          <div className="rounded-lg border border-dorado/40 bg-dorado/5 p-3 flex flex-col gap-2">
            <p className="text-texto">
              Le avisaste el {formatFecha(aviso.created_at)} que tenía {aviso.saldo_al_avisar} puntos. ¿Qué respondió?
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-texto-secundario self-center">Si acepta, canjeá el premio abajo.</span>
              <Button
                variante="secundario"
                disabled={isPending}
                onClick={() => startTransition(() => responderAviso(aviso.id, "guarda"))}
              >
                Lo guarda para más adelante
              </Button>
              <Button
                variante="fantasma"
                disabled={isPending}
                onClick={() => startTransition(() => responderAviso(aviso.id, "no_interesa"))}
              >
                No le interesa
              </Button>
            </div>
            {resumen.estado_aviso === "reavisar" && (
              <p className="text-xs text-texto-secundario">
                Pasaron {config.reaviso_dias} días sin respuesta: podés volver a avisarle.
              </p>
            )}
          </div>
        )}

        {resumen.premios_disponibles.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={premioElegido}
              onChange={(e) => setPremioElegido(e.target.value)}
              className="campo sm:w-auto flex-1"
              aria-label="Premio a canjear"
            >
              <option value="">Canjear un premio…</option>
              {resumen.premios_disponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.puntos} pts)
                </option>
              ))}
            </select>
            <Button disabled={isPending || !premioElegido} onClick={canjear}>
              Canjear
            </Button>
          </div>
        )}
        {errorCanje && <p className="text-rojo">{errorCanje}</p>}

        {canjesPendientes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wide text-texto-secundario">Premios canjeados sin usar</p>
            {canjesPendientes.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-borde px-3 py-2">
                <span className="text-texto">
                  {c.premio_nombre} <span className="text-texto-secundario">· {formatFecha(c.created_at)}</span>
                </span>
                <button
                  onClick={() => startTransition(() => marcarCanjeUsado(c.id))}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-xs text-verde hover:underline disabled:opacity-50"
                >
                  <Check size={14} /> Marcar usado
                </button>
              </div>
            ))}
          </div>
        )}

        {ajustando ? (
          <AjustePuntosForm
            clienteId={cliente.id}
            sugeridos={config.puntos_por_motivo}
            onListo={() => setAjustando(false)}
          />
        ) : (
          <button
            onClick={() => setAjustando(true)}
            className="self-start inline-flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto"
          >
            <Plus size={14} /> Sumar o restar puntos a mano
          </button>
        )}

        <div className="flex flex-col gap-1.5 pt-2 border-t border-borde">
          <p className="text-xs uppercase tracking-wide text-texto-secundario">Historial de puntos</p>
          {movimientos.length === 0 && avisos.length === 0 ? (
            <p className="text-texto-secundario">Todavía no sumó puntos. Se suman solos al cobrar una orden.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 min-w-0 text-texto">
                    {m.puntos >= 0 ? (
                      <Star size={12} className="text-dorado shrink-0" />
                    ) : (
                      <Minus size={12} className="text-texto-secundario shrink-0" />
                    )}
                    <span className="truncate">{m.motivo ?? m.tipo}</span>
                    <span className="text-xs text-texto-secundario shrink-0">{formatFecha(m.created_at)}</span>
                  </span>
                  <span className={`tabular-nums shrink-0 ${m.puntos >= 0 ? "text-verde" : "text-texto-secundario"}`}>
                    {m.puntos > 0 ? `+${m.puntos}` : m.puntos}
                  </span>
                </li>
              ))}
              {avisos
                .filter((a) => a.respuesta)
                .slice(0, 5)
                .map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs text-texto-secundario">
                    <Badge tono="neutro">Aviso</Badge>
                    {formatFecha(a.created_at)} · {RESPUESTA_AVISO_LABEL[a.respuesta!]}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function AjustePuntosForm({
  clienteId,
  sugeridos,
  onListo,
}: {
  clienteId: string;
  sugeridos: ConfigFidelizacion["puntos_por_motivo"];
  onListo: () => void;
}) {
  const [puntos, setPuntos] = useState("");
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoFidelizacionForm, formData: FormData) => {
      const r = await ajustarPuntos(clienteId, prev, formData);
      if (r.ok) onListo();
      return r;
    },
    {} as EstadoFidelizacionForm
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-borde bg-panel-2 p-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-2">
        <select
          name="motivo"
          defaultValue=""
          required
          onChange={(e) => {
            const sugerido = sugeridos[e.target.value as MotivoPuntos];
            if (sugerido) setPuntos(String(sugerido));
          }}
          className="campo"
          aria-label="Motivo"
        >
          <option value="" disabled>
            Motivo
          </option>
          {(Object.keys(MOTIVO_PUNTOS_LABEL) as MotivoPuntos[]).map((m) => (
            <option key={m} value={m}>
              {MOTIVO_PUNTOS_LABEL[m]}
            </option>
          ))}
        </select>
        <input
          name="puntos"
          type="number"
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          placeholder="Puntos"
          className="campo"
          aria-label="Puntos (negativo para restar)"
          required
        />
      </div>
      <input name="detalle" placeholder="Detalle (ej. recomendó a Juan Pérez)" className="campo" />
      <p className="text-xs text-texto-secundario">Para restar, poné un número negativo (ej. -20).</p>
      {estado.error && <p className="text-sm text-rojo">{estado.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variante="secundario" onClick={onListo}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
