"use client";

import { PasoCliente } from "./PasoCliente";
import { PasoAuto } from "./PasoAuto";
import type { EstadoReserva } from "./estado";

/**
 * Tus datos: primero si ya es cliente (lo buscamos por celular y le
 * mostramos sus autos cargados) o si es nuevo; después, el auto.
 */
export function PasoDatos({
  estado,
  actualizar,
}: {
  estado: EstadoReserva;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
}) {
  const clienteListo = estado.modo === "nuevo" || estado.busqueda.estado === "encontrado";
  return (
    <div className="flex flex-col gap-8">
      <PasoCliente estado={estado} actualizar={actualizar} />
      {clienteListo && (
        <div className="border-t border-borde pt-6">
          <PasoAuto estado={estado} actualizar={actualizar} />
        </div>
      )}
    </div>
  );
}
