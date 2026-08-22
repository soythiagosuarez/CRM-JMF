"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { crearTurno, type EstadoTurnoForm } from "@/app/(app)/agenda/actions";
import type { ClienteConVehiculos } from "@/lib/types/cliente";
import type { Servicio } from "@/lib/types/servicio";

const estadoInicial: EstadoTurnoForm = {};

export function TurnoForm({
  clientes,
  servicios,
  fechaInicial,
  onCancelar,
  onGuardado,
}: {
  clientes: ClienteConVehiculos[];
  servicios: Servicio[];
  fechaInicial?: string;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [clienteId, setClienteId] = useState("");
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoTurnoForm, formData: FormData) => {
      const resultado = await crearTurno(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  const clienteSeleccionado = clientes.find((c) => c.id === clienteId);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="modo" value={modo} />

      <div className="flex rounded-lg border border-borde overflow-hidden self-start">
        {(["existente", "nuevo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={`px-3 py-1.5 text-sm ${
              modo === m ? "bg-rojo/10 text-rojo" : "text-texto-secundario hover:text-texto"
            }`}
          >
            {m === "existente" ? "Cliente existente" : "Cliente nuevo"}
          </button>
        ))}
      </div>

      {modo === "existente" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente_id" className="text-sm text-texto-secundario">
              Cliente
            </label>
            <select
              id="cliente_id"
              name="cliente_id"
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="campo"
            >
              <option value="" disabled>
                Elegí un cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo}
                </option>
              ))}
            </select>
            {clientes.length === 0 && (
              <p className="text-xs text-texto-secundario">
                Todavía no hay clientes cargados. Usá &quot;Cliente nuevo&quot;.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehiculo_id" className="text-sm text-texto-secundario">
              Vehículo
            </label>
            <select
              id="vehiculo_id"
              name="vehiculo_id"
              required
              disabled={!clienteSeleccionado}
              className="campo disabled:opacity-50"
            >
              <option value="" disabled>
                {clienteSeleccionado ? "Elegí un vehículo" : "Elegí un cliente primero"}
              </option>
              {clienteSeleccionado?.vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.marca, v.modelo].filter(Boolean).join(" ") || "Vehículo"}
                  {v.patente ? ` · ${v.patente}` : ""}
                </option>
              ))}
            </select>
            {clienteSeleccionado && clienteSeleccionado.vehiculos.length === 0 && (
              <p className="text-xs text-rojo">
                Este cliente no tiene vehículos cargados. Agregale uno primero en su ficha.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-borde bg-panel-2 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="nombre_completo" placeholder="Nombre completo" required className="campo" />
            <input name="telefono" placeholder="Teléfono" className="campo" />
            <input name="email" type="email" placeholder="Email" className="campo" />
            <input name="como_llego" placeholder="Cómo llegó" className="campo" />
          </div>
          <textarea name="notas" placeholder="Notas" rows={2} className="campo resize-none" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input name="marca" placeholder="Marca" required className="campo" />
            <input name="modelo" placeholder="Modelo" className="campo" />
            <input name="anio" type="number" placeholder="Año" className="campo" />
            <input name="patente" placeholder="Patente" className="campo uppercase" />
            <input name="color" placeholder="Color" className="campo sm:col-span-2" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fecha" className="text-sm text-texto-secundario">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={fechaInicial}
            className="campo"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hora" className="text-sm text-texto-secundario">
            Hora
          </label>
          <input id="hora" name="hora" type="time" required className="campo" />
          <p className="text-xs text-texto-secundario">
            Lun a vie 9–18 · Sáb 10–13
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-texto-secundario">Servicios previstos</span>
        <div className="flex flex-wrap gap-2">
          {servicios.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-1.5 rounded-full border border-borde bg-panel-2 px-3 py-1.5 text-sm text-texto has-checked:border-rojo has-checked:text-rojo"
            >
              <input
                type="checkbox"
                name="servicios_previstos"
                value={s.id}
                className="accent-rojo"
              />
              {s.nombre}
            </label>
          ))}
        </div>
      </div>

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
          {enviando ? "Guardando..." : "Agendar turno"}
        </Button>
      </div>
    </form>
  );
}
