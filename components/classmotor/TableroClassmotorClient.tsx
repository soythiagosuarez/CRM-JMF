"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AutoForm } from "./AutoForm";
import { AutoModal } from "./AutoModal";
import { crearAutoClassmotor, moverEstadoClassmotor } from "@/app/(app)/classmotor/actions";
import { ESTADO_LABEL, ORDEN_ESTADOS, calcularGanancia } from "@/lib/types/classmotor";
import { formatARS } from "@/lib/format";
import type { AutoClassmotor, EstadoAutoClassmotor } from "@/lib/types/classmotor";
import type { ClienteConVehiculos } from "@/lib/types/cliente";

const COLOR_COLUMNA: Record<EstadoAutoClassmotor, string> = {
  ingresa: "border-t-texto-secundario",
  en_preparacion_estetica: "border-t-rojo",
  sesion_fotos_contenido: "border-t-rojo",
  publicado_pautado: "border-t-dorado",
  cliente_viene_a_verlo: "border-t-dorado",
  vendido: "border-t-verde",
};

export function TableroClassmotorClient({
  autos,
  clientes,
}: {
  autos: AutoClassmotor[];
  clientes: ClienteConVehiculos[];
}) {
  const [creando, setCreando] = useState(false);
  const [autoAbiertoId, setAutoAbiertoId] = useState<string | null>(null);
  const [columnaSobrevolada, setColumnaSobrevolada] = useState<EstadoAutoClassmotor | null>(null);
  const [arrastrandoIndice, setArrastrandoIndice] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const porEstado = new Map<EstadoAutoClassmotor, AutoClassmotor[]>();
  for (const a of autos) {
    if (!porEstado.has(a.estado)) porEstado.set(a.estado, []);
    porEstado.get(a.estado)!.push(a);
  }

  const autoAbierto = autoAbiertoId ? autos.find((a) => a.id === autoAbiertoId) ?? null : null;

  const onDrop = (columna: EstadoAutoClassmotor, e: React.DragEvent) => {
    e.preventDefault();
    setColumnaSobrevolada(null);
    const id = e.dataTransfer.getData("text/plain");
    setArrastrandoIndice(null);
    if (!id) return;
    const auto = autos.find((a) => a.id === id);
    if (!auto) return;

    const indiceOrigen = ORDEN_ESTADOS.indexOf(auto.estado);
    const indiceDestino = ORDEN_ESTADOS.indexOf(columna);
    if (indiceDestino <= indiceOrigen) return; // solo hacia adelante

    const nombre = [auto.marca, auto.modelo].filter(Boolean).join(" ") || "el auto";
    const mensaje =
      columna === "vendido"
        ? `¿Confirmás la venta de ${nombre}? Se registra ${formatARS(calcularGanancia(auto))} de ganancia en Finanzas. No se puede deshacer.`
        : `¿Confirmás pasar ${nombre} a "${ESTADO_LABEL[columna]}"? No se puede volver atrás.`;
    if (!confirm(mensaje)) return;

    startTransition(() => moverEstadoClassmotor(auto.id, columna));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/brands/classmotor.png" alt="" width={44} height={44} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-texto">Gestión Classmotor</h1>
            <p className="text-sm text-texto-secundario mt-1">
              Fichas de auto por estado, con la ganancia calculada. Arrastrá para avanzar — no
              se puede volver atrás.
            </p>
          </div>
        </div>
        {!creando && (
          <Button onClick={() => setCreando(true)}>
            <Plus size={16} />
            Nuevo auto
          </Button>
        )}
      </div>

      {creando && (
        <Card>
          <CardHeader title="Nuevo auto" />
          <AutoForm
            clientes={clientes}
            accion={crearAutoClassmotor}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {autos.length === 0 && !creando ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">Todavía no hay autos cargados en Classmotor.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo auto&quot; para cargar el primero.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {ORDEN_ESTADOS.map((estado, indiceColumna) => {
            const items = porEstado.get(estado) ?? [];
            const destinoValido = arrastrandoIndice === null || indiceColumna > arrastrandoIndice;
            return (
              <div
                key={estado}
                onDragOver={(e) => {
                  if (!destinoValido) return;
                  e.preventDefault();
                  setColumnaSobrevolada(estado);
                }}
                onDragLeave={() =>
                  setColumnaSobrevolada((c) => (c === estado ? null : c))
                }
                onDrop={(e) => onDrop(estado, e)}
                className={`flex flex-col gap-3 rounded-lg border-t-4 ${COLOR_COLUMNA[estado]} p-1 transition-opacity ${
                  columnaSobrevolada === estado ? "bg-panel-2/60" : ""
                } ${arrastrandoIndice !== null && !destinoValido ? "opacity-30" : ""}`}
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wide">
                    {ESTADO_LABEL[estado]}
                  </h2>
                  <span className="text-xs text-texto-secundario">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {items.map((a) => {
                    const ganancia = calcularGanancia(a);
                    return (
                      <Card
                        key={a.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", a.id);
                          setArrastrandoIndice(indiceColumna);
                        }}
                        onDragEnd={() => setArrastrandoIndice(null)}
                        onClick={() => setAutoAbiertoId(a.id)}
                        className="cursor-grab active:cursor-grabbing hover:border-rojo/40"
                      >
                        <p className="text-sm text-texto font-medium truncate">
                          {[a.marca, a.modelo].filter(Boolean).join(" ") || "Auto"}
                        </p>
                        <p className="text-xs text-texto-secundario truncate mt-0.5">
                          {[a.patente, a.anio].filter(Boolean).join(" · ") || "Sin datos"}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            ganancia > 0
                              ? "text-verde"
                              : ganancia < 0
                                ? "text-rojo"
                                : "text-texto-secundario"
                          }`}
                        >
                          Ganancia {formatARS(ganancia)}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {autoAbierto && (
        <AutoModal auto={autoAbierto} clientes={clientes} onCerrar={() => setAutoAbiertoId(null)} />
      )}
    </div>
  );
}
