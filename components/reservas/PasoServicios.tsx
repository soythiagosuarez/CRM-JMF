"use client";

import { Camera, Check, Clock, Minus, Plus } from "lucide-react";
import { precioItem, seCotizaPorFoto, textoPrecio } from "@/lib/reservas/precios";
import type { ItemReserva, ServicioPublico } from "@/lib/types/reserva";
import type { UnidadDuracion } from "@/lib/types/servicio";
import { Seccion } from "./ui";

function textoDuracion(
  valor: number | null | undefined,
  unidad: UnidadDuracion | null | undefined
): string | null {
  if (!valor) return null;
  if (unidad === "horas") return `${valor} ${valor === 1 ? "hora" : "horas"}`;
  return `${valor} ${valor === 1 ? "día" : "días"}`;
}

/** Cada opción que se puede reservar: un servicio sin variantes, o cada
 * variante de un servicio (PPF Full front, Cerámico Gtechnic C1, etc.). */
interface OpcionServicio {
  clave: string;
  servicio: ServicioPublico;
  variante: number | null;
  titulo: string;
  duracion: string | null;
  unidad: string | null;
}

function opcionesDe(servicios: ServicioPublico[]): OpcionServicio[] {
  return servicios.flatMap((s): OpcionServicio[] => {
    if (s.variantes.length === 0) {
      return [
        {
          clave: s.id,
          servicio: s,
          variante: null,
          titulo: s.nombre,
          duracion: textoDuracion(s.duracion_valor, s.duracion_unidad),
          unidad: null,
        },
      ];
    }
    return s.variantes.map((v, i) => {
      return {
        clave: `${s.id}:${i}`,
        servicio: s,
        variante: i,
        titulo: v.nombre,
        duracion:
          v.duracion_valor != null
            ? textoDuracion(v.duracion_valor, v.duracion_unidad ?? "dias")
            : textoDuracion(s.duracion_valor, s.duracion_unidad),
        unidad: v.unidad ?? null,
      };
    });
  });
}

/** Clases de la lista: en la página, alto según la pantalla; embebida en
 * la web (iframe que crece con el contenido), alto fijo y scroll propio
 * también en el celular, si no «Siguiente» quedaría al final de todo. */
const LISTA_PAGINA =
  "sm:max-h-[min(calc(100dvh-31rem),620px)] sm:min-h-72 sm:overflow-y-auto sm:overscroll-contain sm:pb-10 sm:[mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]";
const LISTA_EMBEBIDA =
  "max-h-[480px] sm:max-h-[560px] overflow-y-auto overscroll-contain pb-10 [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]";

export function PasoServicios({
  servicios,
  items,
  cambiarItems,
  embebida = false,
}: {
  servicios: ServicioPublico[];
  items: ItemReserva[];
  cambiarItems: (items: ItemReserva[]) => void;
  embebida?: boolean;
}) {
  const opciones = opcionesDe(servicios);
  // Una sección por servicio (PPF, Polarizado, Tratamiento cerámico…)
  // con sus opciones adentro, en el orden del catálogo.
  const categorias = servicios
    .map((s) => ({
      servicio: s,
      opciones: opciones.filter((o) => o.servicio.id === s.id),
    }))
    .filter((c) => c.opciones.length > 0);
  const itemDe = (o: OpcionServicio) =>
    items.find((i) => i.servicio_id === o.servicio.id && i.variante === o.variante);

  // Una opción por servicio: elegir otra variante del mismo servicio la reemplaza.
  const alternar = (o: OpcionServicio) => {
    if (itemDe(o)) {
      cambiarItems(items.filter((i) => i.servicio_id !== o.servicio.id));
      return;
    }
    // Llantas: casi siempre son las 4.
    const nuevo: ItemReserva = {
      servicio_id: o.servicio.id,
      variante: o.variante,
      cantidad: o.unidad === "llanta" ? 4 : 1,
    };
    const otros = items.filter((i) => i.servicio_id !== o.servicio.id);
    cambiarItems([...otros, nuevo]);
  };

  const cambiarCantidad = (o: OpcionServicio, cantidad: number) => {
    const nueva = Math.min(8, Math.max(1, cantidad));
    cambiarItems(items.map((i) => (i.servicio_id === o.servicio.id ? { ...i, cantidad: nueva } : i)));
  };

  return (
    <Seccion
      titulo="¿Qué servicio querés?"
      subtitulo="Elegí uno o más. Si sumás varios, se hacen en el mismo turno."
    >
      {/* Tablet y compu: la lista tiene su propio scroll, así el título y
          «Siguiente» (abajo de la tarjeta) quedan siempre a la vista. En el
          celular la lista va con la página y la barra queda fija abajo. */}
      <div className="-mx-1">
        <div
          tabIndex={0}
          aria-label="Servicios"
          className={`flex flex-col gap-7 px-1 focus-visible:outline-offset-4 ${embebida ? LISTA_EMBEBIDA : LISTA_PAGINA}`}
        >
          {categorias.map(({ servicio, opciones: delServicio }) => (
            <section
              key={servicio.id}
              aria-labelledby={`categoria-${servicio.id}`}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <h3
                  id={`categoria-${servicio.id}`}
                  className="shrink-0 text-xs font-semibold uppercase tracking-wider text-texto"
                >
                  {servicio.nombre}
                </h3>
                <span className="h-px flex-1 bg-borde" />
                {delServicio.length > 1 && (
                  <span className="shrink-0 text-xs text-texto-secundario">
                    {delServicio.length} opciones · elegí una
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 lg:gap-3">
                {delServicio.map((o) => {
                  const item = itemDe(o);
                  const elegido = !!item;
                  const precio = textoPrecio(precioItem(o.servicio, { variante: o.variante, cantidad: 1 }));
                  return (
                    <div
                      key={o.clave}
                      className={`relative flex flex-col rounded-xl border transition-colors ${
                        elegido
                          ? "border-rojo bg-rojo/5"
                          : "border-borde bg-panel hover:border-texto-secundario/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => alternar(o)}
                        aria-pressed={elegido}
                        className="flex flex-1 flex-col gap-2 p-4 md:p-3.5 lg:p-4 text-left"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm lg:text-base font-semibold text-texto leading-snug">
                              {o.titulo}
                            </span>
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              elegido ? "border-rojo bg-rojo text-white" : "border-texto-secundario/50"
                            }`}
                            aria-hidden
                          >
                            {elegido && <Check size={13} strokeWidth={3} />}
                          </span>
                        </span>

                        {o.variante == null && o.servicio.descripcion && (
                          <span className="text-xs text-texto-secundario line-clamp-3">
                            {o.servicio.descripcion}
                          </span>
                        )}

                        <span className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-1">
                          <span className="text-sm lg:text-base font-semibold text-texto tabular-nums">
                            {precio}
                            {o.unidad && (
                              <span className="text-xs font-normal text-texto-secundario"> c/{o.unidad}</span>
                            )}
                          </span>
                          {o.duracion && (
                            <span className="inline-flex items-center gap-1 text-xs text-texto-secundario">
                              <Clock size={12} /> {o.duracion}
                            </span>
                          )}
                        </span>
                        {o.variante == null && seCotizaPorFoto(o.servicio) && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-texto-secundario">
                            <Camera size={12} /> Se cotiza con una foto del bollo
                          </span>
                        )}
                      </button>

                      {elegido && o.unidad && (
                        <div className="flex items-center justify-between gap-3 border-t border-borde px-4 py-2.5 text-sm">
                          <span className="text-texto-secundario">Cantidad de {o.unidad}s</span>
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(o, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-borde text-texto disabled:opacity-30"
                            >
                              <Minus size={14} />
                              <span className="sr-only">Una menos</span>
                            </button>
                            <span className="w-5 text-center font-medium tabular-nums text-texto">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(o, item.cantidad + 1)}
                              disabled={item.cantidad >= 8}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-borde text-texto disabled:opacity-30"
                            >
                              <Plus size={14} />
                              <span className="sr-only">Una más</span>
                            </button>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Seccion>
  );
}
