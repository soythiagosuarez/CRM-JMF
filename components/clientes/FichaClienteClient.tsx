"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Phone, Mail, Wrench } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClienteForm } from "./ClienteForm";
import { VehiculoForm } from "./VehiculoForm";
import {
  actualizarCliente,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  eliminarCliente,
  registrarServicioHistorico,
  type EstadoFormulario,
} from "@/app/(app)/clientes/actions";
import { formatARS, formatFecha } from "@/lib/format";
import type { ClienteConVehiculos } from "@/lib/types/cliente";
import type { OrdenConDatos } from "@/lib/types/orden";
import type { Servicio } from "@/lib/types/servicio";

const ESTADO_LABEL = {
  en_cola: "En cola",
  en_proceso: "En proceso",
  terminado: "Terminado",
  entregado: "Entregado",
} as const;

const ESTADO_TONO = {
  en_cola: "neutro",
  en_proceso: "rojo",
  terminado: "premium",
  entregado: "positivo",
} as const;

export function FichaClienteClient({
  cliente,
  historial,
  servicios,
}: {
  cliente: ClienteConVehiculos;
  historial: OrdenConDatos[];
  servicios: Servicio[];
}) {
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [agregandoVehiculo, setAgregandoVehiculo] = useState(false);
  const [editandoVehiculoId, setEditandoVehiculoId] = useState<string | null>(null);
  const [cargandoHistorialDe, setCargandoHistorialDe] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const borrarVehiculo = (vehiculoId: string) => {
    if (!confirm("¿Eliminar este vehículo? No se puede deshacer.")) return;
    startTransition(() => {
      eliminarVehiculo(cliente.id, vehiculoId);
    });
  };

  const borrarCliente = () => {
    if (
      !confirm(
        `¿Eliminar a ${cliente.nombre_completo}? Se borran también sus vehículos. No se puede deshacer.`
      )
    )
      return;
    setErrorEliminar(null);
    startTransition(async () => {
      const resultado = await eliminarCliente(cliente.id);
      if (resultado?.error) setErrorEliminar(resultado.error);
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
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setEditandoDatos(true)}
                className="flex items-center gap-1.5 text-xs text-texto-secundario hover:text-texto"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                onClick={borrarCliente}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs text-texto-secundario hover:text-rojo disabled:opacity-50"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        )}
        {errorEliminar && (
          <p className="text-sm text-rojo mt-3" role="alert">
            {errorEliminar}
          </p>
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
              <div key={v.id} className="rounded-lg border border-borde bg-panel-2 p-3">
                <div className="flex items-center justify-between gap-3">
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
                    {servicios.length > 0 && (
                      <button
                        onClick={() =>
                          setCargandoHistorialDe(cargandoHistorialDe === v.id ? null : v.id)
                        }
                        className="text-xs text-texto-secundario hover:text-texto"
                      >
                        Cargar servicio hecho
                      </button>
                    )}
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
                {cargandoHistorialDe === v.id && (
                  <div className="mt-3 pt-3 border-t border-borde">
                    <ServicioHistoricoForm
                      clienteId={cliente.id}
                      vehiculoId={v.id}
                      servicios={servicios}
                      onGuardado={() => setCargandoHistorialDe(null)}
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Historial de servicios" />
        {historial.length === 0 ? (
          <p className="text-sm text-texto-secundario">
            Todavía no tiene órdenes registradas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historial.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-panel-2 p-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Wrench size={14} className="text-texto-secundario mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-texto truncate">
                      {o.servicio_principal_nombre}
                      {o.servicios_adicionales_nombres.length > 0 &&
                        ` + ${o.servicios_adicionales_nombres.map((s) => s.nombre).join(", ")}`}
                    </p>
                    <p className="text-xs text-texto-secundario mt-0.5">
                      {o.vehiculo_descripcion || "Sin vehículo"} ·{" "}
                      {o.fecha_ingreso ? formatFecha(o.fecha_ingreso) : "Sin fecha"}
                      {o.precio_total ? ` · ${formatARS(o.precio_total)}` : ""}
                    </p>
                  </div>
                </div>
                <Badge tono={ESTADO_TONO[o.estado]}>{ESTADO_LABEL[o.estado]}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ServicioHistoricoForm({
  clienteId,
  vehiculoId,
  servicios,
  onGuardado,
}: {
  clienteId: string;
  vehiculoId: string;
  servicios: Servicio[];
  onGuardado: () => void;
}) {
  const [estado, formAction, enviando] = useActionState<EstadoFormulario, FormData>(
    async (prev, formData) => {
      const resultado = await registrarServicioHistorico(clienteId, vehiculoId, prev, formData);
      if (resultado.ok) onGuardado();
      return resultado;
    },
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-xs text-texto-secundario">
        Para dejar cargado un servicio que ya se le hizo a este auto antes de usar el sistema.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select name="servicio_id" required defaultValue="" className="campo">
          <option value="" disabled>
            Servicio
          </option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        <input name="fecha" type="date" required className="campo" />
        <input name="precio_total" type="number" min="0" placeholder="Precio (opcional)" className="campo" />
      </div>
      {estado.error && <p className="text-xs text-rojo">{estado.error}</p>}
      <Button type="submit" variante="secundario" disabled={enviando} className="self-start">
        {enviando ? "Guardando..." : "Cargar al historial"}
      </Button>
    </form>
  );
}
