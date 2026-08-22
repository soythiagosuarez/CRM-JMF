"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClienteForm } from "./ClienteForm";
import { VehiculoForm } from "./VehiculoForm";
import {
  actualizarCliente,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
} from "@/app/(app)/clientes/actions";
import type { ClienteConVehiculos } from "@/lib/types/cliente";

export function FichaClienteClient({ cliente }: { cliente: ClienteConVehiculos }) {
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [agregandoVehiculo, setAgregandoVehiculo] = useState(false);
  const [editandoVehiculoId, setEditandoVehiculoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const borrarVehiculo = (vehiculoId: string) => {
    if (!confirm("¿Eliminar este vehículo? No se puede deshacer.")) return;
    startTransition(() => {
      eliminarVehiculo(cliente.id, vehiculoId);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        {editandoDatos ? (
          <>
            <CardHeader title="Editar cliente" />
            <ClienteForm
              cliente={cliente}
              accion={actualizarCliente.bind(null, cliente.id)}
              onCancelar={() => setEditandoDatos(false)}
              onGuardado={() => setEditandoDatos(false)}
            />
          </>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-texto">
                {cliente.nombre_completo}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-texto-secundario">
                {cliente.telefono && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} /> {cliente.telefono}
                  </span>
                )}
                {cliente.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} /> {cliente.email}
                  </span>
                )}
              </div>
              {cliente.como_llego && (
                <p className="text-sm text-texto-secundario mt-2">
                  Cómo llegó: {cliente.como_llego}
                </p>
              )}
              {cliente.notas && (
                <p className="text-sm text-texto-secundario mt-2">{cliente.notas}</p>
              )}
            </div>
            <button
              onClick={() => setEditandoDatos(true)}
              className="flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto shrink-0"
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Vehículos"
          action={
            !agregandoVehiculo && (
              <Button variante="secundario" onClick={() => setAgregandoVehiculo(true)}>
                <Plus size={16} />
                Agregar
              </Button>
            )
          }
        />

        {agregandoVehiculo && (
          <div className="mb-4 pb-4 border-b border-borde">
            <VehiculoForm
              accion={crearVehiculo.bind(null, cliente.id)}
              onCancelar={() => setAgregandoVehiculo(false)}
              onGuardado={() => setAgregandoVehiculo(false)}
            />
          </div>
        )}

        {cliente.vehiculos.length === 0 && !agregandoVehiculo && (
          <p className="text-sm text-texto-secundario py-4">
            Todavía no tiene vehículos cargados.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {cliente.vehiculos.map((v) =>
            editandoVehiculoId === v.id ? (
              <div key={v.id} className="rounded-lg border border-borde bg-panel-2 p-3">
                <VehiculoForm
                  vehiculo={v}
                  accion={actualizarVehiculo.bind(null, cliente.id, v.id)}
                  onCancelar={() => setEditandoVehiculoId(null)}
                  onGuardado={() => setEditandoVehiculoId(null)}
                />
              </div>
            ) : (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-panel-2 p-3"
              >
                <div>
                  <p className="text-sm text-texto">
                    {[v.marca, v.modelo, v.anio].filter(Boolean).join(" ") || "Vehículo"}
                  </p>
                  <p className="text-xs text-texto-secundario mt-0.5">
                    {[v.patente, v.color].filter(Boolean).join(" · ") || "Sin datos"}
                  </p>
                  {v.detalles && (
                    <p className="text-xs text-texto-secundario mt-0.5">{v.detalles}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setEditandoVehiculoId(v.id)}
                    className="text-texto-secundario hover:text-texto"
                    aria-label="Editar vehículo"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => borrarVehiculo(v.id)}
                    disabled={isPending}
                    className="text-texto-secundario hover:text-rojo disabled:opacity-50"
                    aria-label="Eliminar vehículo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Historial de servicios" />
        <p className="text-sm text-texto-secundario">
          Vas a ver acá las órdenes de este cliente cuando esté construido el módulo
          Autos / Órdenes.
        </p>
      </Card>
    </div>
  );
}
