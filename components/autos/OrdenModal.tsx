"use client";

import { useActionState, useState, useTransition } from "react";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatARS, formatFecha } from "@/lib/format";
import {
  linkWhatsapp,
  mensajeCambioFase,
  mensajeListoRetira,
  mensajeListoPuertaAPuerta,
} from "@/lib/whatsapp";
import {
  avanzarFase,
  retrocederFase,
  toggleFlag,
  actualizarPrecio,
  marcarCobrado,
  marcarEntrega,
  type EstadoPrecioForm,
  type EstadoCobroForm,
} from "@/app/(app)/autos/actions";
import type { OrdenConDatos, FlagOrden } from "@/lib/types/orden";

const FLAGS: { id: FlagOrden; label: string }[] = [
  { id: "esperando_repuesto_producto", label: "Esperando repuesto/producto" },
  { id: "esperando_cliente", label: "Esperando cliente" },
  { id: "demorado", label: "Demorado" },
];

export function OrdenModal({
  orden,
  onCerrar,
}: {
  orden: OrdenConDatos;
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const indiceFase = orden.servicio_principal_fases.indexOf(orden.fase_actual ?? "");
  const esUltimaFase = indiceFase === orden.servicio_principal_fases.length - 1;

  return (
    <Modal titulo={orden.cliente_nombre} onCerrar={onCerrar}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tono="neutro">{orden.vehiculo_descripcion || "Sin vehículo"}</Badge>
          <Badge tono="neutro">{orden.servicio_principal_nombre}</Badge>
          {orden.fecha_ingreso && (
            <Badge tono="neutro">Ingresó {formatFecha(orden.fecha_ingreso)}</Badge>
          )}
        </div>

        {/* Fases */}
        {orden.estado !== "entregado" && (
          <div>
            <p className="text-sm text-texto-secundario mb-2">Fase actual</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {orden.servicio_principal_fases.map((fase, i) => (
                <span
                  key={fase}
                  className={`text-xs rounded-full border px-2.5 py-1 ${
                    i === indiceFase
                      ? "border-rojo text-rojo bg-rojo/10 font-medium"
                      : i < indiceFase
                        ? "border-verde/30 text-verde bg-verde/10"
                        : "border-borde text-texto-secundario"
                  }`}
                >
                  {fase}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variante="secundario"
                disabled={isPending || indiceFase <= 0}
                onClick={() => startTransition(() => retrocederFase(orden.id))}
              >
                <ChevronLeft size={14} />
                Anterior
              </Button>
              <Button
                disabled={isPending || orden.estado === "terminado"}
                onClick={() => startTransition(() => avanzarFase(orden.id))}
              >
                {esUltimaFase ? "Marcar terminado" : "Avanzar fase"}
                <ChevronRight size={14} />
              </Button>
              <a
                href={linkWhatsapp(
                  orden.cliente_telefono ?? "",
                  mensajeCambioFase(
                    orden.cliente_nombre,
                    orden.vehiculo_descripcion,
                    orden.fase_actual ?? ""
                  )
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline ml-auto self-center"
              >
                <MessageCircle size={14} />
                Avisar
              </a>
            </div>
          </div>
        )}

        {/* Flags */}
        <div>
          <p className="text-sm text-texto-secundario mb-2">Estado del auto</p>
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((f) => {
              const activo = orden.flags.includes(f.id);
              return (
                <button
                  key={f.id}
                  disabled={isPending}
                  onClick={() => startTransition(() => toggleFlag(orden.id, f.id))}
                  className={`text-xs rounded-full border px-3 py-1.5 ${
                    activo
                      ? "border-rojo/40 bg-rojo/10 text-rojo"
                      : "border-borde text-texto-secundario hover:text-texto"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Precio */}
        <PrecioForm ordenId={orden.id} precioActual={orden.precio_total} />

        {/* Cobro */}
        {orden.estado_pago === "cobrado" ? (
          <div className="rounded-lg border border-verde/30 bg-verde/10 p-3 text-sm text-verde">
            Cobrado: {formatARS(orden.monto_ars ?? 0)}
            {orden.medio_pago && ` · ${orden.medio_pago.replace(/_/g, " ")}`}
            {orden.fecha_cobro && ` · ${formatFecha(orden.fecha_cobro)}`}
          </div>
        ) : (
          <CobroForm ordenId={orden.id} />
        )}

        {/* Entrega */}
        {orden.estado === "entregado" ? (
          <div className="rounded-lg border border-borde bg-panel-2 p-3 text-sm text-texto-secundario">
            Entregado{orden.entrega === "retira" ? " (retiró)" : " (puerta a puerta)"}
            {orden.fecha_entrega && ` · ${formatFecha(orden.fecha_entrega)}`}
          </div>
        ) : orden.estado === "terminado" ? (
          <div className="flex flex-col gap-2 border-t border-borde pt-4">
            <p className="text-sm text-texto-secundario">Entrega</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variante="secundario"
                disabled={isPending}
                onClick={() => startTransition(() => marcarEntrega(orden.id, "retira"))}
              >
                Retira el cliente
              </Button>
              <Button
                variante="secundario"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => marcarEntrega(orden.id, "puerta_a_puerta"))
                }
              >
                Puerta a puerta
              </Button>
              <a
                href={linkWhatsapp(
                  orden.cliente_telefono ?? "",
                  mensajeListoRetira(orden.cliente_nombre, orden.vehiculo_descripcion)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline self-center"
              >
                <MessageCircle size={14} />
                Avisar (retira)
              </a>
              <a
                href={linkWhatsapp(
                  orden.cliente_telefono ?? "",
                  mensajeListoPuertaAPuerta(orden.cliente_nombre, orden.vehiculo_descripcion)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline self-center"
              >
                <MessageCircle size={14} />
                Avisar (puerta a puerta)
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function PrecioForm({
  ordenId,
  precioActual,
}: {
  ordenId: string;
  precioActual: number | null;
}) {
  const [estado, formAction, enviando] = useActionState<EstadoPrecioForm, FormData>(
    actualizarPrecio.bind(null, ordenId),
    {}
  );

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5 flex-1">
        <label htmlFor="precio_total" className="text-sm text-texto-secundario">
          Precio acordado
        </label>
        <input
          id="precio_total"
          name="precio_total"
          type="number"
          min="0"
          defaultValue={precioActual ?? ""}
          className="campo"
        />
      </div>
      <Button type="submit" variante="secundario" disabled={enviando}>
        {enviando ? "..." : "Guardar"}
      </Button>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
    </form>
  );
}

function CobroForm({ ordenId }: { ordenId: string }) {
  const [moneda, setMoneda] = useState("ARS");
  const [estado, formAction, enviando] = useActionState<EstadoCobroForm, FormData>(
    marcarCobrado.bind(null, ordenId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-borde pt-4">
      <p className="text-sm text-texto-secundario">Registrar cobro</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="monto" type="number" min="0" step="0.01" placeholder="Monto" className="campo" />
        <select
          name="moneda"
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          className="campo"
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
          <option value="USDT">USDT</option>
          <option value="cheque">Cheque</option>
        </select>
        <select name="medio_pago" className="campo" defaultValue="">
          <option value="" disabled>
            Medio de pago
          </option>
          <option value="efectivo_pesos">Efectivo pesos</option>
          <option value="efectivo_dolares">Efectivo dólares</option>
          <option value="transferencia">Transferencia</option>
          <option value="cheque">Cheque</option>
          <option value="usdt">USDT</option>
        </select>
        <input
          name="fecha_cobro"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="campo"
        />
        {moneda !== "ARS" && (
          <input
            name="tipo_cambio"
            type="number"
            min="0"
            step="0.01"
            placeholder="Tipo de cambio del día"
            className="campo col-span-2"
          />
        )}
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando..." : "Marcar cobrado"}
      </Button>
    </form>
  );
}
