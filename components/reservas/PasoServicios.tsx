"use client";

import { Check, Clock, MessageCircle } from "lucide-react";
import {
  AVISO_PRECIO_VARIABLE,
  precioItem,
  textoPrecio,
  textoPrecioCatalogo,
  textoPrecioTotal,
} from "@/lib/reservas/precios";
import type { ItemReserva, ServicioPublico } from "@/lib/types/reserva";
import type { UnidadDuracion } from "@/lib/types/servicio";
import { Aviso, Seccion } from "./ui";

function textoDuracion(valor: number | null | undefined, unidad: UnidadDuracion | null | undefined): string | null {
  if (!valor) return null;
  if (unidad === "horas") return `${valor} ${valor === 1 ? "hora" : "horas"}`;
  return `${valor} ${valor === 1 ? "día" : "días"}`;
}

function duracionServicio(s: ServicioPublico): string | null {
  const conDuracion = s.variantes.filter((v) => v.duracion_valor);
  if (conDuracion.length > 1) {
    const dias = conDuracion.map((v) => v.duracion_valor!);
    const min = Math.min(...dias);
    const max = Math.max(...dias);
    if (min !== max) return `${min} a ${max} días`;
  }
  return textoDuracion(s.duracion_valor, s.duracion_unidad);
}

export function PasoServicios({
  servicios,
  items,
  cambiarItems,
}: {
  servicios: ServicioPublico[];
  items: ItemReserva[];
  cambiarItems: (items: ItemReserva[]) => void;
}) {
  const itemDe = (id: string) => items.find((i) => i.servicio_id === id);

  const alternar = (s: ServicioPublico) => {
    if (itemDe(s.id)) {
      cambiarItems(items.filter((i) => i.servicio_id !== s.id));
    } else {
      cambiarItems([...items, { servicio_id: s.id, variante: s.variantes.length === 1 ? 0 : null, cantidad: 1 }]);
    }
  };

  const elegirVariante = (s: ServicioPublico, variante: number) => {
    const unidad = s.variantes[variante].unidad;
    // Llantas: casi siempre son las 4.
    const cantidadPorDefecto = unidad === "llanta" ? 4 : 1;
    cambiarItems(
      items.map((i) =>
        i.servicio_id === s.id
          ? { ...i, variante, cantidad: unidad ? (i.cantidad > 1 ? i.cantidad : cantidadPorDefecto) : 1 }
          : i
      )
    );
  };

  const cambiarCantidad = (s: ServicioPublico, cantidad: number) => {
    cambiarItems(items.map((i) => (i.servicio_id === s.id ? { ...i, cantidad } : i)));
  };

  const elegidos = items
    .map((i) => ({ item: i, servicio: servicios.find((s) => s.id === i.servicio_id) }))
    .filter((x): x is { item: ItemReserva; servicio: ServicioPublico } => !!x.servicio);
  const hayVariable = elegidos.some(({ item, servicio }) => precioItem(servicio, item).variable);
  const hayConsulta = elegidos.some(({ servicio }) => servicio.reserva_online === "consulta");

  return (
    <Seccion titulo="¿Qué le hacemos?" subtitulo="Podés elegir más de un servicio para el mismo turno.">
      <div className="flex flex-col gap-3">
        {servicios.map((s) => {
          const item = itemDe(s.id);
          const elegido = !!item;
          const duracion = duracionServicio(s);
          return (
            <div
              key={s.id}
              className={`rounded-xl border transition-colors ${
                elegido ? "border-rojo bg-rojo/5" : "border-borde bg-panel"
              }`}
            >
              <button
                type="button"
                onClick={() => alternar(s)}
                aria-pressed={elegido}
                className="w-full text-left flex items-start gap-3 px-4 py-3"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    elegido ? "border-rojo bg-rojo text-white" : "border-texto-secundario/60"
                  }`}
                >
                  {elegido && <Check size={14} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-texto">{s.nombre}</span>
                    <span className="text-sm text-texto tabular-nums">{textoPrecioCatalogo(s)}</span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-secundario">
                    {duracion && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {duracion}
                      </span>
                    )}
                    {s.reserva_online === "consulta" && (
                      <span className="inline-flex items-center gap-1 text-dorado">
                        <MessageCircle size={12} /> Se confirma por WhatsApp
                      </span>
                    )}
                  </span>
                  {s.descripcion && <span className="mt-1 block text-xs text-texto-secundario">{s.descripcion}</span>}
                </span>
              </button>

              {elegido && s.variantes.length > 1 && (
                <div className="flex flex-col gap-1.5 px-4 pb-3 pl-12" role="radiogroup" aria-label={`Opciones de ${s.nombre}`}>
                  {s.variantes.map((v, i) => (
                    <label
                      key={v.nombre}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                        item!.variante === i ? "border-rojo/60 bg-rojo/10" : "border-borde bg-fondo-2"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <input
                          type="radio"
                          name={`variante-${s.id}`}
                          checked={item!.variante === i}
                          onChange={() => elegirVariante(s, i)}
                          className="accent-rojo shrink-0"
                        />
                        <span className="text-texto">{v.nombre}</span>
                      </span>
                      <span className="text-texto-secundario tabular-nums shrink-0">
                        {textoPrecio(precioItem(s, { variante: i, cantidad: 1 }))}
                        {v.unidad ? ` c/${v.unidad}` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {elegido && item!.variante != null && s.variantes[item!.variante]?.unidad && (
                <div className="flex items-center gap-3 px-4 pb-3 pl-12 text-sm">
                  <label htmlFor={`cantidad-${s.id}`} className="text-texto-secundario">
                    Cantidad de {s.variantes[item!.variante].unidad}s
                  </label>
                  <select
                    id={`cantidad-${s.id}`}
                    value={item!.cantidad}
                    onChange={(e) => cambiarCantidad(s, Number(e.target.value))}
                    className="campo w-20"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {elegidos.length > 0 && (
        <div className="rounded-xl border border-borde bg-panel-2 px-4 py-3 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-texto-secundario">Total aproximado</span>
            <span className="font-display text-lg font-semibold text-texto tabular-nums">
              {textoPrecioTotal(servicios, items)}
            </span>
          </div>
          {hayVariable && <p className="text-xs text-texto-secundario">{AVISO_PRECIO_VARIABLE}</p>}
        </div>
      )}

      {hayConsulta && (
        <Aviso tono="premium">
          Elegiste un servicio que se confirma por WhatsApp: tu turno queda reservado y te escribimos para definir
          el precio final según tu auto.
        </Aviso>
      )}
    </Seccion>
  );
}
