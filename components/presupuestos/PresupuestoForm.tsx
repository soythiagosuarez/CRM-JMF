"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { crearPresupuesto, type EstadoForm } from "@/app/(app)/presupuestos/actions";
import { formatearAR, aValorNumerico } from "@/components/ui/MontoInput";
import type { Servicio } from "@/lib/types/servicio";

const estadoInicial: EstadoForm = {};

interface FilaServicio {
  key: number;
  nombre: string;
  precio: string;
}

export function PresupuestoForm({
  servicios,
  onCancelar,
  onGuardado,
}: {
  servicios: Servicio[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const [filas, setFilas] = useState<FilaServicio[]>([{ key: 0, nombre: "", precio: "" }]);
  const [siguienteKey, setSiguienteKey] = useState(1);
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoForm, formData: FormData) => {
      const resultado = await crearPresupuesto(prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    estadoInicial
  );

  const agregarFila = () => {
    setFilas((f) => [...f, { key: siguienteKey, nombre: "", precio: "" }]);
    setSiguienteKey((k) => k + 1);
  };

  const quitarFila = (key: number) => {
    setFilas((f) => (f.length > 1 ? f.filter((fila) => fila.key !== key) : f));
  };

  const actualizarFila = (key: number, campo: "nombre" | "precio", valor: string) => {
    const valorFinal = campo === "precio" ? formatearAR(valor) : valor;
    setFilas((f) => f.map((fila) => (fila.key === key ? { ...fila, [campo]: valorFinal } : fila)));
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input name="nombre_contacto" placeholder="Nombre del contacto" required className="campo" />
        <input name="telefono" placeholder="Teléfono (para WhatsApp)" className="campo" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input name="vehiculo_marca" placeholder="Marca" className="campo" />
        <input name="vehiculo_modelo" placeholder="Modelo" className="campo" />
        <input name="vehiculo_patente" placeholder="Patente" className="campo uppercase" />
      </div>

      <textarea
        name="que_observo"
        placeholder="Qué se observó (bollo, rayones, suciedad, etc.)"
        rows={2}
        className="campo resize-none"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm text-texto-secundario">Servicios y precios</span>
        {filas.map((fila) => (
          <div key={fila.key} className="flex gap-2">
            <input
              list="catalogo-servicios"
              name="servicio_nombre"
              placeholder="Servicio"
              value={fila.nombre}
              onChange={(e) => actualizarFila(fila.key, "nombre", e.target.value)}
              className="campo flex-1"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Precio"
              value={fila.precio}
              onChange={(e) => actualizarFila(fila.key, "precio", e.target.value)}
              className="campo w-32"
            />
            <input type="hidden" name="servicio_precio" value={aValorNumerico(fila.precio)} />
            <button
              type="button"
              onClick={() => quitarFila(fila.key)}
              className="text-texto-secundario hover:text-rojo shrink-0"
              aria-label="Quitar servicio"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <datalist id="catalogo-servicios">
          {servicios.map((s) => (
            <option key={s.id} value={s.nombre} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={agregarFila}
          className="flex items-center gap-1.5 text-sm text-rojo hover:underline self-start"
        >
          <Plus size={14} />
          Agregar servicio
        </button>
      </div>

      <input name="tiempo_estimado" placeholder="Tiempo estimado (ej. 5 días)" className="campo" />

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
          {enviando ? "Guardando..." : "Generar presupuesto"}
        </Button>
      </div>
    </form>
  );
}
