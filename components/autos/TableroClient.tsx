"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrdenModal } from "./OrdenModal";
import { TurnoPopup } from "@/components/agenda/TurnoPopup";
import { marcarIngresado } from "@/app/(app)/agenda/actions";
import { moverOrdenEstado } from "@/app/(app)/autos/actions";
import type { EstadoOrden, OrdenConDatos } from "@/lib/types/orden";
import type { TurnoConDatos } from "@/lib/types/turno";

type ColumnaId = "esperando_ingreso" | EstadoOrden;

const COLUMNAS: { id: ColumnaId; titulo: string; color: string }[] = [
  { id: "esperando_ingreso", titulo: "Esperando el ingreso", color: "border-t-texto" },
  { id: "en_cola", titulo: "En cola", color: "border-t-texto-secundario" },
  { id: "en_proceso", titulo: "En proceso", color: "border-t-rojo" },
  { id: "terminado", titulo: "Terminado", color: "border-t-dorado" },
  { id: "entregado", titulo: "Entregado", color: "border-t-verde" },
];

// Orden del flujo: el tablero solo se mueve hacia adelante (§ feedback UX).
const INDICE_COLUMNA: Record<ColumnaId, number> = {
  esperando_ingreso: 0,
  en_cola: 1,
  en_proceso: 2,
  terminado: 3,
  entregado: 4,
};

const FLAG_LABEL: Record<string, string> = {
  esperando_repuesto_producto: "Esperando repuesto",
  esperando_cliente: "Esperando cliente",
  demorado: "Demorado",
};

interface Arrastrado {
  id: string;
  origen: "turno" | "orden";
  indiceOrigen: number;
  nombreCliente: string;
}

export function TableroClient({
  ordenes,
  esperandoIngreso,
}: {
  ordenes: OrdenConDatos[];
  esperandoIngreso: TurnoConDatos[];
}) {
  const [ordenAbierta, setOrdenAbierta] = useState<OrdenConDatos | null>(null);
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoConDatos | null>(null);
  const [columnaSobrevolada, setColumnaSobrevolada] = useState<ColumnaId | null>(null);
  const [arrastrando, setArrastrando] = useState<Arrastrado | null>(null);
  const [, startTransition] = useTransition();

  const porEstado = new Map<EstadoOrden, OrdenConDatos[]>();
  for (const o of ordenes) {
    if (!porEstado.has(o.estado)) porEstado.set(o.estado, []);
    porEstado.get(o.estado)!.push(o);
  }

  const ordenActualizada = ordenAbierta
    ? (ordenes.find((o) => o.id === ordenAbierta.id) ?? null)
    : null;
  const turnoActualizado = turnoAbierto
    ? (esperandoIngreso.find((t) => t.id === turnoAbierto.id) ?? null)
    : null;

  const totalItems = ordenes.length + esperandoIngreso.length;

  const esDestinoValido = (item: Arrastrado | null, columna: ColumnaId): boolean => {
    if (!item) return true;
    if (item.origen === "turno") return columna === "en_cola";
    return INDICE_COLUMNA[columna] > item.indiceOrigen;
  };

  const onDrop = (columna: ColumnaId, e: React.DragEvent) => {
    e.preventDefault();
    setColumnaSobrevolada(null);
    const raw = e.dataTransfer.getData("application/json");
    setArrastrando(null);
    if (!raw) return;
    const item: Arrastrado = JSON.parse(raw);

    if (!esDestinoValido(item, columna)) return;

    if (item.origen === "turno") {
      if (!confirm(`¿Confirmás que ${item.nombreCliente} ingresó al taller?`)) return;
      startTransition(() => marcarIngresado(item.id));
      return;
    }

    if (columna === "entregado") {
      const orden = ordenes.find((o) => o.id === item.id);
      if (orden) setOrdenAbierta(orden); // la entrega pide retira/puerta a puerta, se elige en el modal
      return;
    }
    if (columna === "esperando_ingreso") return; // ya validado por esDestinoValido, guarda para TS

    const columnaTitulo = COLUMNAS.find((c) => c.id === columna)?.titulo ?? columna;
    if (!confirm(`¿Mover el auto de ${item.nombreCliente} a "${columnaTitulo}"?`)) return;
    startTransition(() => moverOrdenEstado(item.id, columna));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-texto">Gestión de autos</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Tablero de fases. Arrastrá las tarjetas para avanzar un auto — no se puede volver
          para atrás.
        </p>
      </div>

      {totalItems === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay autos en el taller ahora mismo.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Cuando haya un turno agendado para hoy, va a aparecer acá en &quot;Esperando el
            ingreso&quot;.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {COLUMNAS.map((col) => {
            const items = col.id === "esperando_ingreso" ? esperandoIngreso : porEstado.get(col.id) ?? [];
            const destinoValido = esDestinoValido(arrastrando, col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  if (!destinoValido) return;
                  e.preventDefault();
                  setColumnaSobrevolada(col.id);
                }}
                onDragLeave={() => setColumnaSobrevolada((c) => (c === col.id ? null : c))}
                onDrop={(e) => onDrop(col.id, e)}
                className={`flex flex-col gap-3 rounded-lg border-t-4 ${col.color} p-1 transition-opacity ${
                  columnaSobrevolada === col.id ? "bg-panel-2/60" : ""
                } ${arrastrando && !destinoValido ? "opacity-30" : ""}`}
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
                    {col.titulo}
                  </h2>
                  <span className="text-xs text-texto-secundario">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {col.id === "esperando_ingreso"
                    ? (items as TurnoConDatos[]).map((t) => (
                        <Card
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            const data: Arrastrado = {
                              id: t.id,
                              origen: "turno",
                              indiceOrigen: 0,
                              nombreCliente: t.cliente_nombre,
                            };
                            e.dataTransfer.setData("application/json", JSON.stringify(data));
                            setArrastrando(data);
                          }}
                          onDragEnd={() => setArrastrando(null)}
                          onClick={() => setTurnoAbierto(t)}
                          className="cursor-grab active:cursor-grabbing hover:border-rojo/40 border-dashed"
                        >
                          <p className="text-sm text-texto font-medium truncate">
                            {t.cliente_nombre}
                          </p>
                          <p className="text-xs text-texto-secundario truncate mt-0.5">
                            {t.vehiculo_descripcion || "Sin vehículo"}
                          </p>
                          <p className="text-xs text-texto-secundario mt-1">
                            {t.hora.slice(0, 5)} hs · {t.servicios_nombres.join(", ")}
                          </p>
                        </Card>
                      ))
                    : (items as OrdenConDatos[]).map((o) => (
                        <Card
                          key={o.id}
                          draggable={col.id !== "entregado"}
                          onDragStart={(e) => {
                            const data: Arrastrado = {
                              id: o.id,
                              origen: "orden",
                              indiceOrigen: INDICE_COLUMNA[o.estado],
                              nombreCliente: o.cliente_nombre,
                            };
                            e.dataTransfer.setData("application/json", JSON.stringify(data));
                            setArrastrando(data);
                          }}
                          onDragEnd={() => setArrastrando(null)}
                          onClick={() => setOrdenAbierta(o)}
                          className={`hover:border-rojo/40 ${
                            col.id !== "entregado" ? "cursor-grab active:cursor-grabbing" : ""
                          }`}
                        >
                          <p className="text-sm text-texto font-medium truncate">
                            {o.cliente_nombre}
                          </p>
                          <p className="text-xs text-texto-secundario truncate mt-0.5">
                            {o.vehiculo_descripcion || "Sin vehículo"}
                          </p>
                          <p className="text-xs text-texto-secundario mt-1">
                            {o.servicio_principal_nombre}
                          </p>

                          {col.id === "en_proceso" && o.servicio_principal_fases.length > 0 && (
                            <div className="mt-2">
                              <div className="flex gap-0.5">
                                {o.servicio_principal_fases.map((fase, i) => (
                                  <span
                                    key={fase}
                                    className={`h-1 flex-1 rounded-full ${
                                      i <= o.servicio_principal_fases.indexOf(o.fase_actual ?? "")
                                        ? "bg-rojo"
                                        : "bg-panel-2"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-rojo mt-1">
                                {o.fase_actual} · Actualizar fase →
                              </p>
                            </div>
                          )}

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
                            <div className="mt-2">
                              <Badge tono="positivo">Cobrado</Badge>
                            </div>
                          )}
                        </Card>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ordenActualizada && (
        <OrdenModal orden={ordenActualizada} onCerrar={() => setOrdenAbierta(null)} />
      )}
      {turnoActualizado && (
        <TurnoPopup turno={turnoActualizado} onCerrar={() => setTurnoAbierto(null)} />
      )}
    </div>
  );
}
