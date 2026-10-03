"use client";

import { useActionState, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MontoInput } from "@/components/ui/MontoInput";
import type { EstadoServicioForm } from "@/app/(app)/servicios/actions";
import type { Servicio, VarianteServicio } from "@/lib/types/servicio";

interface FilaVariante extends VarianteServicio {
  clave: number;
}

const FILA_VACIA: VarianteServicio = {
  nombre: "",
  precio: 0,
  precio_hasta: null,
  unidad: null,
  duracion_valor: null,
  duracion_unidad: null,
};

const estadoInicial: EstadoServicioForm = {};

export function ServicioForm({
  servicio,
  accion,
  onCancelar,
  onGuardado,
}: {
  servicio?: Servicio;
  accion: (
    prevState: EstadoServicioForm,
    formData: FormData
  ) => Promise<EstadoServicioForm>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [filas, setFilas] = useState<FilaVariante[]>(() =>
    (servicio?.variantes ?? []).map((v, clave) => ({ ...v, clave }))
  );
  const siguienteClave = useRef(servicio?.variantes.length ?? 0);
  const agregarFila = () => {
    const clave = siguienteClave.current++;
    setFilas((f) => [...f, { ...FILA_VACIA, clave }]);
  };
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoServicioForm, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nombre" htmlFor="nombre">
          <input
            id="nombre"
            name="nombre"
            defaultValue={servicio?.nombre}
            required
            className="campo"
          />
        </Campo>
        <Campo label="Tiempo estimado" htmlFor="tiempo_estimado">
          <input
            id="tiempo_estimado"
            name="tiempo_estimado"
            placeholder="ej. 5 días, 5 horas"
            defaultValue={servicio?.tiempo_estimado ?? ""}
            className="campo"
          />
        </Campo>
      </div>

      <Campo label="Descripción / qué incluye" htmlFor="descripcion">
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={servicio?.descripcion ?? ""}
          className="campo resize-none"
        />
      </Campo>

      <Campo
        label="Fases (una por línea, en orden)"
        htmlFor="fases"
        ayuda="Se muestran en este orden en el tablero de Autos / Órdenes."
      >
        <textarea
          id="fases"
          name="fases"
          rows={6}
          required
          defaultValue={servicio?.fases.join("\n") ?? ""}
          className="campo resize-none font-mono text-sm"
        />
      </Campo>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-borde p-4">
        <legend className="px-1 text-sm font-medium text-texto">Agenda online y precios</legend>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="¿Se reserva online?" htmlFor="reserva_online">
            <select
              id="reserva_online"
              name="reserva_online"
              defaultValue={servicio?.reserva_online ?? "no"}
              className="campo"
            >
              <option value="si">Sí, se confirma solo</option>
              <option value="consulta">Sí, queda a confirmar por WhatsApp</option>
              <option value="no">No se ofrece online</option>
            </select>
          </Campo>
          <Campo label="Moneda" htmlFor="moneda">
            <select id="moneda" name="moneda" defaultValue={servicio?.moneda ?? "ARS"} className="campo">
              <option value="ARS">Pesos</option>
              <option value="USD">Dólares</option>
            </select>
          </Campo>
          <Campo label="Puntos de fidelización" htmlFor="categoria_fidelizacion">
            <select
              id="categoria_fidelizacion"
              name="categoria_fidelizacion"
              defaultValue={servicio?.categoria_fidelizacion ?? "basico"}
              className="campo"
            >
              <option value="basico">Básico: suma puntos</option>
              <option value="premium">Premium: no suma puntos</option>
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Campo label="Duración" htmlFor="duracion_valor" ayuda="En el taller">
            <input
              id="duracion_valor"
              name="duracion_valor"
              type="number"
              min="1"
              step="1"
              defaultValue={servicio?.duracion_valor ?? ""}
              className="campo"
            />
          </Campo>
          <Campo label="Unidad" htmlFor="duracion_unidad">
            <select
              id="duracion_unidad"
              name="duracion_unidad"
              defaultValue={servicio?.duracion_unidad ?? "dias"}
              className="campo"
            >
              <option value="horas">Horas</option>
              <option value="dias">Días</option>
            </select>
          </Campo>
          <Campo label="Máximo por día" htmlFor="limite_dia" ayuda="Vacío = sin tope">
            <input
              id="limite_dia"
              name="limite_dia"
              type="number"
              min="1"
              step="1"
              defaultValue={servicio?.limite_dia ?? ""}
              className="campo"
            />
          </Campo>
          <Campo label="Máximo por semana" htmlFor="limite_semana" ayuda="Vacío = sin tope">
            <input
              id="limite_semana"
              name="limite_semana"
              type="number"
              min="1"
              step="1"
              defaultValue={servicio?.limite_semana ?? ""}
              className="campo"
            />
          </Campo>
        </div>

        {filas.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Precio desde" htmlFor="precio_referencia">
              <MontoInput id="precio_referencia" name="precio_referencia" defaultValue={servicio?.precio_referencia} />
            </Campo>
            <Campo label="Precio hasta" htmlFor="precio_hasta" ayuda="Solo si el precio varía">
              <MontoInput id="precio_hasta" name="precio_hasta" defaultValue={servicio?.precio_hasta} />
            </Campo>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-texto-secundario">
              Opciones con precio propio{" "}
              <span className="text-xs">· ej. productos del cerámico, tipos de polarizado</span>
            </p>
            <button
              type="button"
              onClick={agregarFila}
              className="inline-flex items-center gap-1 text-xs text-rojo hover:underline shrink-0"
            >
              <Plus size={14} /> Agregar opción
            </button>
          </div>
          {filas.map((fila) => (
            <div key={fila.clave} className="grid grid-cols-2 sm:grid-cols-12 gap-2 rounded-lg border border-borde bg-panel-2 p-2">
              <input
                name="variante_nombre"
                defaultValue={fila.nombre}
                placeholder="Nombre de la opción"
                aria-label="Nombre de la opción"
                className="campo col-span-2 sm:col-span-4"
                required
              />
              <div className="sm:col-span-2">
                <MontoInput name="variante_precio" defaultValue={fila.precio || null} placeholder="Precio" />
              </div>
              <div className="sm:col-span-2">
                <MontoInput name="variante_precio_hasta" defaultValue={fila.precio_hasta} placeholder="Hasta (opc.)" />
              </div>
              <input
                name="variante_unidad"
                defaultValue={fila.unidad ?? ""}
                placeholder="Precio por… (ej. llanta)"
                aria-label="Precio por unidad"
                className="campo sm:col-span-2"
              />
              <div className="col-span-2 sm:col-span-2 flex items-center gap-1">
                <input
                  name="variante_duracion_valor"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={fila.duracion_valor ?? ""}
                  placeholder="Dura"
                  aria-label="Duración propia de la opción"
                  className="campo"
                />
                <select
                  name="variante_duracion_unidad"
                  defaultValue={fila.duracion_unidad ?? "dias"}
                  aria-label="Unidad de la duración"
                  className="campo"
                >
                  <option value="dias">días</option>
                  <option value="horas">horas</option>
                </select>
                <button
                  type="button"
                  onClick={() => setFilas((f) => f.filter((x) => x.clave !== fila.clave))}
                  className="text-texto-secundario hover:text-rojo p-1 shrink-0"
                  aria-label="Quitar opción"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filas.length > 0 && (
            <p className="text-xs text-texto-secundario">
              La duración de cada opción es opcional: si queda vacía, se usa la del servicio.
            </p>
          )}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          label="Mantenimiento (meses)"
          htmlFor="mantenimiento_intervalo_meses"
          ayuda="Solo tratamientos"
        >
          <input
            id="mantenimiento_intervalo_meses"
            name="mantenimiento_intervalo_meses"
            type="number"
            min="0"
            step="1"
            defaultValue={servicio?.mantenimiento_intervalo_meses ?? ""}
            className="campo"
          />
        </Campo>
        <Campo label="Renovación (meses)" htmlFor="renovacion_meses" ayuda="Solo tratamientos">
          <input
            id="renovacion_meses"
            name="renovacion_meses"
            type="number"
            min="0"
            step="1"
            defaultValue={servicio?.renovacion_meses ?? ""}
            className="campo"
          />
        </Campo>
      </div>

      <label className="flex items-center gap-2 text-sm text-texto-secundario">
        <input
          type="checkbox"
          name="puerta_a_puerta"
          defaultChecked={servicio?.puerta_a_puerta ?? true}
          className="accent-rojo"
        />
        Puerta a puerta
      </label>

      {estado.error && (
        <p className="text-sm text-rojo" role="alert">
          {estado.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

function Campo({
  label,
  htmlFor,
  ayuda,
  children,
}: {
  label: string;
  htmlFor: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-texto-secundario">
        {label} {ayuda && <span className="text-xs">· {ayuda}</span>}
      </label>
      {children}
    </div>
  );
}
