"use client";

import Link from "next/link";
import { fechaLarga, textoFranja } from "@/lib/reservas/fechas";
import { AVISO_PRECIO_VARIABLE, nombreItem, precioItem, textoPrecioTotal } from "@/lib/reservas/precios";
import { TAMANO_LABEL } from "@/lib/reservas/vehiculos";
import { CANAL_LABEL, type CanalReserva, type DatosAgendaPublica } from "@/lib/types/reserva";
import type { Franja } from "@/lib/types/config";
import { Aviso, Campo, Seccion } from "./ui";
import type { EstadoReserva } from "./estado";

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-borde last:border-0">
      <dt className="text-xs uppercase tracking-wide text-texto-secundario sm:w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-texto min-w-0">{children}</dd>
    </div>
  );
}

export function PasoConfirmar({
  datos,
  estado,
  franja,
  fechaListo,
  actualizar,
  embebida,
}: {
  datos: DatosAgendaPublica;
  estado: EstadoReserva;
  franja: Franja | null;
  fechaListo: string | null;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
  embebida: boolean;
}) {
  const servicioDe = (id: string) => datos.servicios.find((s) => s.id === id);
  const autoCargado = estado.busqueda.vehiculos.find((v) => v.id === estado.vehiculoId);
  const v = estado.vehiculo;
  const hayVariable = estado.items.some((i) => {
    const s = servicioDe(i.servicio_id);
    return s ? precioItem(s, i).variable : false;
  });
  const hayConsulta = estado.items.some((i) => servicioDe(i.servicio_id)?.reserva_online === "consulta");

  return (
    <Seccion titulo="Revisá y confirmá" subtitulo="Si algo no está bien, volvé al paso anterior.">
      <dl className="rounded-xl border border-borde bg-panel px-4 py-1">
        <Fila label="Vos">
          {estado.busqueda.estado === "encontrado" ? "Cliente de JMF" : estado.nombre}
          <span className="text-texto-secundario"> · {estado.telefono}</span>
        </Fila>
        <Fila label="Auto">
          {autoCargado ? (
            <>
              {autoCargado.descripcion}
              {autoCargado.patente && <span className="text-texto-secundario"> · {autoCargado.patente}</span>}
            </>
          ) : (
            <>
              {v.marca} {v.modelo} {v.anio}
              <span className="text-texto-secundario">
                {" "}
                · {v.patente.toUpperCase()} · {v.color}
                {v.tamano ? ` · ${TAMANO_LABEL[v.tamano]}` : ""}
                {v.condicion === "0km" ? " · 0 km" : ""}
              </span>
            </>
          )}
        </Fila>
        <Fila label="Servicios">
          <ul className="flex flex-col gap-0.5">
            {estado.items.map((i) => {
              const s = servicioDe(i.servicio_id);
              return s ? <li key={i.servicio_id}>{nombreItem(s, i)}</li> : null;
            })}
          </ul>
        </Fila>
        <Fila label="Ingreso">
          {estado.fecha && franja ? `${fechaLarga(estado.fecha)}, ${textoFranja(franja.desde, franja.hasta)}` : "—"}
        </Fila>
        {fechaListo && estado.fecha && (
          <Fila label="Listo">
            {fechaListo === estado.fecha ? "Ese mismo día" : fechaLarga(fechaListo)}
            <span className="text-texto-secundario"> (estimado)</span>
          </Fila>
        )}
        {estado.puertaAPuerta && <Fila label="Entrega">Puerta a puerta (lo coordinamos por WhatsApp)</Fila>}
        <Fila label="Precio">
          <span className="font-medium tabular-nums">{textoPrecioTotal(datos.servicios, estado.items)}</span>
        </Fila>
      </dl>

      {hayVariable && <p className="text-xs text-texto-secundario -mt-2">{AVISO_PRECIO_VARIABLE}</p>}
      {hayConsulta && (
        <Aviso tono="premium">
          Este turno queda <strong>a confirmar</strong>: te escribimos por WhatsApp para definir el precio final
          según tu auto.
        </Aviso>
      )}

      <Campo label="¿Cómo nos conociste?" htmlFor="canal">
        <select
          id="canal"
          value={estado.canal}
          onChange={(e) => actualizar({ canal: e.target.value as CanalReserva })}
          className="campo"
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {(Object.keys(CANAL_LABEL) as CanalReserva[]).map((c) => (
            <option key={c} value={c}>
              {CANAL_LABEL[c]}
            </option>
          ))}
        </select>
      </Campo>

      <label className="flex items-start gap-3 cursor-pointer text-sm text-texto">
        <input
          type="checkbox"
          checked={estado.aceptaPromos}
          onChange={(e) => actualizar({ aceptaPromos: e.target.checked })}
          className="accent-rojo mt-1"
        />
        <span>
          Quiero recibir promociones y novedades de JMF por WhatsApp{" "}
          <span className="text-texto-secundario">(opcional)</span>
        </span>
      </label>

      <p className="text-xs text-texto-secundario">
        Al confirmar, aceptás que usemos tus datos para gestionar el turno y comunicarnos con vos. Más
        información en nuestra{" "}
        <Link
          href="/reservar/privacidad"
          target={embebida ? "_blank" : undefined}
          className="underline underline-offset-2 hover:text-texto"
        >
          política de privacidad
        </Link>
        .
      </p>
    </Seccion>
  );
}
