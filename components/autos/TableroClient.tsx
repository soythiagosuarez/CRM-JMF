"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrdenModal } from "./OrdenModal";
import type { EstadoOrden, OrdenConDatos } from "@/lib/types/orden";

const COLUMNAS: { estado: EstadoOrden; titulo: string }[] = [
  { estado: "en_cola", titulo: "En cola" },
  { estado: "en_proceso", titulo: "En proceso" },
  { estado: "terminado", titulo: "Terminado" },
  { estado: "entregado", titulo: "Entregado" },
];

const FLAG_LABEL: Record<string, string> = {
  esperando_repuesto_producto: "Esperando repuesto",
  esperando_cliente: "Esperando cliente",
  demorado: "Demorado",
};

export function TableroClient({ ordenes }: { ordenes: OrdenConDatos[] }) {
  const [ordenAbierta, setOrdenAbierta] = useState<OrdenConDatos | null>(null);

  const porEstado = new Map<EstadoOrden, OrdenConDatos[]>();
  for (const o of ordenes) {
    if (!porEstado.has(o.estado)) porEstado.set(o.estado, []);
    porEstado.get(o.estado)!.push(o);
  }

  // Reflejar cambios en la orden abierta si se actualizó desde el tablero.
  const ordenActualizada = ordenAbierta
    ? (ordenes.find((o) => o.id === ordenAbierta.id) ?? null)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-texto">Autos / Órdenes</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Tablero de fases. Las órdenes nacen al marcar un turno como ingresado en Agenda.
        </p>
      </div>

      {ordenes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay autos en el taller ahora mismo.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Cuando marqués un turno como &quot;ingresado&quot; en Agenda, va a aparecer acá.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNAS.map((col) => (
            <div key={col.estado} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
                  {col.titulo}
                </h2>
                <span className="text-xs text-texto-secundario">
                  {porEstado.get(col.estado)?.length ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {(porEstado.get(col.estado) ?? []).map((o) => (
                  <Card
                    key={o.id}
                    onClick={() => setOrdenAbierta(o)}
                    className="cursor-pointer hover:border-rojo/40"
                  >
                    <p className="text-sm text-texto font-medium truncate">{o.cliente_nombre}</p>
                    <p className="text-xs text-texto-secundario truncate mt-0.5">
                      {o.vehiculo_descripcion || "Sin vehículo"}
                    </p>
                    <p className="text-xs text-texto-secundario mt-1">
                      {o.servicio_principal_nombre}
                      {o.fase_actual && o.estado !== "entregado" ? ` · ${o.fase_actual}` : ""}
                    </p>
                    {o.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {o.flags.map((f) => (
                          <Badge key={f} tono="negativo">
                            {FLAG_LABEL[f] ?? f}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {o.estado_pago === "cobrado" && (
                      <Badge tono="positivo">Cobrado</Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {ordenActualizada && (
        <OrdenModal orden={ordenActualizada} onCerrar={() => setOrdenAbierta(null)} />
      )}
    </div>
  );
}
