"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EstadoMovimientoForm } from "@/app/(app)/finanzas/actions";
import { CATEGORIAS, MARCA_LABEL, type MarcaMovimiento, type MonedaMovimiento, type Movimiento, type TipoMovimiento } from "@/lib/types/movimiento";

const estadoInicial: EstadoMovimientoForm = {};

export function MovimientoForm({
  tipo,
  movimiento,
  accion,
  onCancelar,
  onGuardado,
}: {
  tipo: TipoMovimiento;
  movimiento?: Movimiento;
  accion: (prevState: EstadoMovimientoForm, formData: FormData) => Promise<EstadoMovimientoForm>;
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const marcasDisponibles = (Object.keys(MARCA_LABEL) as MarcaMovimiento[]).filter(
    (m) => CATEGORIAS[tipo][m].length > 0
  );
  const [marca, setMarca] = useState<MarcaMovimiento>(movimiento?.marca ?? marcasDisponibles[0]);
  const [moneda, setMoneda] = useState<MonedaMovimiento>(movimiento?.moneda_original ?? "ARS");
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoMovimientoForm, formData: FormData) => {
      const resultado = await accion(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tipo" value={tipo} />
      {!movimiento && (
        <p className="text-sm text-texto-secundario">
          {tipo === "ingreso"
            ? "Solo para plata suelta: los cobros de órdenes, ventas de Shop y autos vendidos se cargan solos."
            : "Egreso manual (alquiler, insumos, sueldos, etc.)."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="marca" className="text-sm text-texto-secundario">
            Marca
          </label>
          <select
            id="marca"
            name="marca"
            required
            value={marca}
            onChange={(e) => setMarca(e.target.value as MarcaMovimiento)}
            className="campo"
          >
            {marcasDisponibles.map((m) => (
              <option key={m} value={m}>
                {MARCA_LABEL[m]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoria" className="text-sm text-texto-secundario">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            defaultValue={movimiento?.categoria ?? ""}
            className="campo"
          >
            <option value="" disabled>
              Elegí una categoría
            </option>
            {CATEGORIAS[tipo][marca].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="monto" className="text-sm text-texto-secundario">
            Monto
          </label>
          <input
            id="monto"
            name="monto"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={movimiento?.monto ?? ""}
            className="campo"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="moneda_original" className="text-sm text-texto-secundario">
            Moneda
          </label>
          <select
            id="moneda_original"
            name="moneda_original"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as MonedaMovimiento)}
            className="campo"
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="USDT">USDT</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {moneda !== "ARS" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="tipo_cambio" className="text-sm text-texto-secundario">
              Tipo de cambio del día
            </label>
            <input
              id="tipo_cambio"
              name="tipo_cambio"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={movimiento?.tipo_cambio ?? ""}
              className="campo"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="medio_pago" className="text-sm text-texto-secundario">
            Medio de pago
          </label>
          <select
            id="medio_pago"
            name="medio_pago"
            defaultValue={movimiento?.medio_pago ?? ""}
            className="campo"
          >
            <option value="">Sin especificar</option>
            <option value="efectivo_pesos">Efectivo pesos</option>
            <option value="efectivo_dolares">Efectivo dólares</option>
            <option value="transferencia">Transferencia</option>
            <option value="cheque">Cheque</option>
            <option value="usdt">USDT</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fecha" className="text-sm text-texto-secundario">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={movimiento?.fecha ?? new Date().toISOString().slice(0, 10)}
            className="campo"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descripcion" className="text-sm text-texto-secundario">
          Descripción
        </label>
        <input
          id="descripcion"
          name="descripcion"
          defaultValue={movimiento?.descripcion ?? ""}
          className="campo"
        />
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
          {enviando
            ? "Guardando..."
            : movimiento
              ? "Guardar cambios"
              : tipo === "ingreso"
                ? "Cargar ingreso"
                : "Cargar egreso"}
        </Button>
      </div>
    </form>
  );
}
