"use client";

import { Car, Plus } from "lucide-react";
import { CONDICION_LABEL, TAMANOS, sugerirTamano } from "@/lib/reservas/vehiculos";
import type { CondicionVehiculo } from "@/lib/types/reserva";
import { Campo, Opcion, Seccion } from "./ui";
import type { EstadoReserva, VehiculoForm } from "./estado";

export function PasoAuto({
  estado,
  actualizar,
}: {
  estado: EstadoReserva;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
}) {
  const autosCargados = estado.modo === "actual" ? estado.busqueda.vehiculos : [];
  const cargandoNuevo = estado.vehiculoId === null;
  const v = estado.vehiculo;

  const cambiar = (cambios: Partial<VehiculoForm>) => {
    const vehiculo = { ...v, ...cambios };
    // Si no eligió tamaño a mano, se lo sugerimos por el modelo.
    if (cambios.modelo !== undefined && (!v.tamano || v.tamano === sugerirTamano(v.modelo))) {
      const sugerido = sugerirTamano(cambios.modelo);
      if (sugerido) vehiculo.tamano = sugerido;
    }
    actualizar({ vehiculo });
  };

  return (
    <Seccion
      titulo="Tu auto"
      subtitulo={
        autosCargados.length > 0
          ? "Elegí el auto que traés o cargá uno nuevo."
          : "Contanos qué auto vas a traer."
      }
    >
      {autosCargados.length > 0 && (
        <div className="flex flex-col gap-2">
          {autosCargados.map((a) => (
            <Opcion
              key={a.id}
              seleccionada={estado.vehiculoId === a.id}
              onClick={() => actualizar({ vehiculoId: a.id })}
            >
              <span className="flex items-center gap-3">
                <Car size={18} className="text-texto-secundario shrink-0" />
                <span className="text-sm text-texto">
                  {a.descripcion}
                  {a.patente && <span className="text-texto-secundario"> · {a.patente}</span>}
                </span>
              </span>
            </Opcion>
          ))}
          <Opcion seleccionada={cargandoNuevo} onClick={() => actualizar({ vehiculoId: null })}>
            <span className="flex items-center gap-3">
              <Plus size={18} className="text-rojo shrink-0" />
              <span className="text-sm text-texto">Traigo otro auto</span>
            </span>
          </Opcion>
        </div>
      )}

      {cargandoNuevo && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Marca" htmlFor="marca">
              <input
                id="marca"
                value={v.marca}
                onChange={(e) => cambiar({ marca: e.target.value })}
                className="campo"
                placeholder="Toyota"
              />
            </Campo>
            <Campo label="Modelo" htmlFor="modelo">
              <input
                id="modelo"
                value={v.modelo}
                onChange={(e) => cambiar({ modelo: e.target.value })}
                className="campo"
                placeholder="Hilux"
              />
            </Campo>
            <Campo label="Año" htmlFor="anio">
              <input
                id="anio"
                type="number"
                inputMode="numeric"
                min={1950}
                max={new Date().getFullYear() + 1}
                value={v.anio}
                onChange={(e) => cambiar({ anio: e.target.value })}
                className="campo"
                placeholder="2022"
              />
            </Campo>
            <Campo label="Patente" htmlFor="patente">
              <input
                id="patente"
                value={v.patente}
                onChange={(e) => cambiar({ patente: e.target.value.toUpperCase() })}
                className="campo uppercase"
                placeholder="AB 123 CD"
                autoCapitalize="characters"
              />
            </Campo>
            <Campo label="Color" htmlFor="color">
              <input
                id="color"
                value={v.color}
                onChange={(e) => cambiar({ color: e.target.value })}
                className="campo"
                placeholder="Gris"
              />
            </Campo>
            <Campo label="¿0 km o usado?" htmlFor="condicion">
              <select
                id="condicion"
                value={v.condicion}
                onChange={(e) => cambiar({ condicion: e.target.value as CondicionVehiculo })}
                className="campo"
              >
                <option value="" disabled>
                  Elegí
                </option>
                {(Object.keys(CONDICION_LABEL) as CondicionVehiculo[]).map((c) => (
                  <option key={c} value={c}>
                    {CONDICION_LABEL[c]}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-texto">Tamaño</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TAMANOS.map((t) => (
                <Opcion
                  key={t.id}
                  seleccionada={v.tamano === t.id}
                  onClick={() => cambiar({ tamano: t.id })}
                  className="px-3 py-2.5"
                >
                  <span className="block text-sm font-medium text-texto">{t.label}</span>
                  <span className="block text-xs text-texto-secundario">{t.ejemplos}</span>
                </Opcion>
              ))}
            </div>
          </div>
        </div>
      )}
    </Seccion>
  );
}
