"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoAutoForm } from "@/app/(app)/classmotor/actions";
import type { AutoClassmotor } from "@/lib/types/classmotor";
import type { ClienteConVehiculos } from "@/lib/types/cliente";

const estadoInicial: EstadoAutoForm = {};

export function AutoForm({
  auto,
  clientes,
  accion,
  onCancelar,
  onGuardado,
}: {
  auto?: AutoClassmotor;
  clientes?: ClienteConVehiculos[];
  accion: (prevState: EstadoAutoForm, formData: FormData) => Promise<EstadoAutoForm>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoAutoForm, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!auto && (
        <>
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cliente_id" className="text-sm text-texto-secundario">
                Cliente
              </label>
              <select id="cliente_id" name="cliente_id" required defaultValue="" className="campo">
                <option value="" disabled>
                  Elegí un cliente
                </option>
                {(clientes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo}
                  </option>
                ))}
              </select>
              {(clientes ?? []).length === 0 && (
                <p className="text-xs text-texto-secundario">
                  Todavía no hay clientes cargados. Usá &quot;Cliente nuevo&quot;.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-borde bg-panel-2 p-3">
              <input name="nombre_completo" placeholder="Nombre completo" required className="campo" />
              <input name="telefono" placeholder="Teléfono" className="campo" />
              <input name="email" type="email" placeholder="Email" className="campo" />
              <input name="como_llego" placeholder="Cómo llegó" className="campo" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fecha_ingreso" className="text-sm text-texto-secundario">
                Fecha de ingreso
              </label>
              <input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="campo"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hora_ingreso" className="text-sm text-texto-secundario">
                Hora de ingreso
              </label>
              <input id="hora_ingreso" name="hora_ingreso" type="time" className="campo" />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tipo" className="text-sm text-texto-secundario">
          Tipo de operación
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue={auto?.tipo ?? ""}
          className="campo"
        >
          <option value="" disabled>
            Elegí el tipo
          </option>
          <option value="compra_venta">Compra-venta (lo compra JMF)</option>
          <option value="preventa_venta">Preventa/venta (a consignación)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <input name="marca" placeholder="Marca" defaultValue={auto?.marca ?? ""} className="campo" />
        <input name="modelo" placeholder="Modelo" defaultValue={auto?.modelo ?? ""} className="campo" />
        <input
          name="anio"
          type="number"
          placeholder="Año"
          defaultValue={auto?.anio ?? ""}
          className="campo"
        />
        <input name="km" type="number" placeholder="Km" defaultValue={auto?.km ?? ""} className="campo" />
        <input
          name="patente"
          placeholder="Patente"
          defaultValue={auto?.patente ?? ""}
          className="campo uppercase"
        />
        <input name="color" placeholder="Color" defaultValue={auto?.color ?? ""} className="campo" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_base" className="text-sm text-texto-secundario">
            Precio base
          </label>
          <input
            id="precio_base"
            name="precio_base"
            type="number"
            min="0"
            placeholder="Compra, o precio del cliente"
            defaultValue={auto?.precio_base ?? ""}
            className="campo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="precio_venta" className="text-sm text-texto-secundario">
            Precio de venta
          </label>
          <input
            id="precio_venta"
            name="precio_venta"
            type="number"
            min="0"
            defaultValue={auto?.precio_venta ?? ""}
            className="campo"
          />
        </div>
      </div>

      <textarea
        name="detalles"
        placeholder="Detalles / observaciones"
        rows={2}
        defaultValue={auto?.detalles ?? ""}
        className="campo resize-none"
      />

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
          {enviando ? "Guardando..." : auto ? "Guardar" : "Cargar auto"}
        </Button>
      </div>
    </form>
  );
}
