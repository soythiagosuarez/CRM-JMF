"use client";

import { useActionState, useState } from "react";
import { Tag, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { actualizarCategorias, type EstadoConfigForm } from "@/app/(app)/config/actions";
import { MARCA_LABEL, type MarcaMovimiento } from "@/lib/types/movimiento";
import type { CategoriasMovimiento } from "@/lib/types/config";

const MARCAS: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];
const estadoInicial: EstadoConfigForm = {};

export function EditableCategoriasForm({
  categoriasMovimiento,
}: {
  categoriasMovimiento: CategoriasMovimiento;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, formAction, enviando] = useActionState(
    async (prev: EstadoConfigForm, formData: FormData) => {
      const resultado = await actualizarCategorias(prev, formData);
      if (resultado.ok) setAbierto(false);
      return resultado;
    },
    estadoInicial
  );

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {MARCAS.map((marca) => {
            const ingresos = categoriasMovimiento.ingreso[marca];
            const egresos = categoriasMovimiento.egreso[marca];
            return (
              <div key={marca} className="rounded-lg border border-borde p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-texto mb-2">
                  <Tag size={14} className="text-texto-secundario" />
                  {MARCA_LABEL[marca]}
                </p>
                {ingresos.length > 0 && (
                  <p className="text-xs text-texto-secundario mb-1">
                    <span className="text-verde">Ingreso:</span> {ingresos.join(", ")}
                  </p>
                )}
                {egresos.length > 0 && (
                  <p className="text-xs text-texto-secundario">
                    <span className="text-rojo">Egreso:</span> {egresos.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setAbierto(true)}
          className="text-texto-secundario hover:text-texto shrink-0"
          aria-label="Editar categorías"
        >
          <Pencil size={14} />
        </button>
      </div>

      {abierto && (
        <Modal titulo="Editar categorías de movimientos" onCerrar={() => setAbierto(false)}>
          <form action={formAction} className="flex flex-col gap-5">
            <p className="text-xs text-texto-secundario">
              Una categoría por línea, separadas con coma. Los movimientos automáticos (órdenes
              cobradas, ventas del Shop, autos vendidos) siguen usando su categoría propia sin
              depender de esta lista.
            </p>
            {MARCAS.map((marca) => (
              <div key={marca} className="rounded-lg border border-borde p-3 flex flex-col gap-3">
                <p className="text-sm font-medium text-texto">{MARCA_LABEL[marca]}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-texto-secundario">Categorías de ingreso</label>
                    <textarea
                      name={`ingreso_${marca}`}
                      defaultValue={categoriasMovimiento.ingreso[marca].join(", ")}
                      rows={2}
                      className="campo resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-texto-secundario">Categorías de egreso</label>
                    <textarea
                      name={`egreso_${marca}`}
                      defaultValue={categoriasMovimiento.egreso[marca].join(", ")}
                      rows={2}
                      className="campo resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            {estado.error && (
              <p className="text-sm text-rojo" role="alert">
                {estado.error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variante="secundario" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
