"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AutoForm } from "./AutoForm";
import { formatARS, formatFecha } from "@/lib/format";
import {
  actualizarAutoClassmotor,
  agregarCostoExtra,
  moverEstadoClassmotor,
  type EstadoCostoForm,
} from "@/app/(app)/classmotor/actions";
import {
  ESTADO_LABEL,
  ORDEN_ESTADOS,
  CONCEPTOS_COSTO_EXTRA,
  calcularGanancia,
} from "@/lib/types/classmotor";
import type { AutoClassmotor } from "@/lib/types/classmotor";

export function AutoModal({
  auto,
  onCerrar,
}: {
  auto: AutoClassmotor;
  onCerrar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ganancia = calcularGanancia(auto);
  const indiceActual = ORDEN_ESTADOS.indexOf(auto.estado);
  const siguienteEstado = ORDEN_ESTADOS[indiceActual + 1];
  const titulo = [auto.marca, auto.modelo].filter(Boolean).join(" ") || "Auto Classmotor";

  const avanzar = () => {
    if (!siguienteEstado) return;
    const mensaje =
      siguienteEstado === "vendido"
        ? `¿Confirmás la venta? Se registra ${formatARS(ganancia)} de ganancia en Finanzas. No se puede deshacer.`
        : `¿Confirmás pasar a "${ESTADO_LABEL[siguienteEstado]}"? No se puede volver atrás.`;
    if (!confirm(mensaje)) return;
    startTransition(() => moverEstadoClassmotor(auto.id, siguienteEstado));
  };

  if (editando) {
    return (
      <Modal titulo={`Editar: ${titulo}`} onCerrar={onCerrar}>
        <AutoForm
          auto={auto}
          accion={actualizarAutoClassmotor.bind(null, auto.id)}
          onCancelar={() => setEditando(false)}
          onGuardado={() => setEditando(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal titulo={titulo} onCerrar={onCerrar}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tono="neutro">
              {auto.tipo === "compra_venta" ? "Compra-venta" : "Preventa/venta"}
            </Badge>
            <Badge tono="neutro">{[auto.patente, auto.color].filter(Boolean).join(" · ") || "Sin datos"}</Badge>
            {auto.km != null && <Badge tono="neutro">{auto.km.toLocaleString("es-AR")} km</Badge>}
          </div>
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto shrink-0"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>

        <div>
          <p className="text-sm text-texto-secundario mb-2">Estado</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ORDEN_ESTADOS.map((e, i) => (
              <span
                key={e}
                className={`text-xs rounded-full border px-2.5 py-1 ${
                  i === indiceActual
                    ? "border-rojo text-rojo bg-rojo/10 font-medium"
                    : i < indiceActual
                      ? "border-verde/30 text-verde bg-verde/10"
                      : "border-borde text-texto-secundario"
                }`}
              >
                {ESTADO_LABEL[e]}
              </span>
            ))}
          </div>
          {siguienteEstado && (
            <Button disabled={isPending} onClick={avanzar}>
              {siguienteEstado === "vendido" ? "Marcar vendido" : `Pasar a "${ESTADO_LABEL[siguienteEstado]}"`}
              <ChevronRight size={14} />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-borde bg-panel-2 p-3">
          <div>
            <p className="text-xs text-texto-secundario">Precio base</p>
            <p className="text-sm text-texto">{auto.precio_base ? formatARS(auto.precio_base) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-texto-secundario">Precio de venta</p>
            <p className="text-sm text-texto">{auto.precio_venta ? formatARS(auto.precio_venta) : "—"}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-borde">
            <p className="text-xs text-texto-secundario">
              Ganancia {auto.estado === "vendido" ? "" : "estimada"}
            </p>
            <p
              className={`font-display text-lg font-semibold ${
                ganancia > 0 ? "text-verde" : ganancia < 0 ? "text-rojo" : "text-texto-secundario"
              }`}
            >
              {formatARS(ganancia)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-texto-secundario mb-2">Costos extra</p>
          {auto.costos_extra.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-3">
              {auto.costos_extra.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-texto-secundario">{c.concepto}</span>
                  <span className="text-texto">{formatARS(c.monto)}</span>
                </div>
              ))}
            </div>
          )}
          <CostoExtraForm autoId={auto.id} />
        </div>

        {auto.fecha_ingreso && (
          <p className="text-xs text-texto-secundario">
            Ingresó {formatFecha(auto.fecha_ingreso)}
            {auto.fecha_venta && ` · Vendido ${formatFecha(auto.fecha_venta)}`}
          </p>
        )}

        {auto.detalles && <p className="text-sm text-texto-secundario">{auto.detalles}</p>}
      </div>
    </Modal>
  );
}

function CostoExtraForm({ autoId }: { autoId: string }) {
  const [estado, formAction, enviando] = useActionState<EstadoCostoForm, FormData>(
    agregarCostoExtra.bind(null, autoId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <select name="concepto" required defaultValue="" className="campo col-span-2">
          <option value="" disabled>
            Concepto
          </option>
          {CONCEPTOS_COSTO_EXTRA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input name="monto" type="number" min="0" placeholder="Monto" required className="campo" />
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <Button type="submit" variante="secundario" disabled={enviando} className="self-start">
        {enviando ? "Guardando..." : "Agregar costo"}
      </Button>
    </form>
  );
}
