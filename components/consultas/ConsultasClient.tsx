"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Car, Mail, MessageCircle, Phone, Trash2, UserRound, Wrench } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  cambiarEstadoConsulta,
  eliminarConsulta,
  guardarNotasConsulta,
  marcarConsultaContactada,
} from "@/app/(app)/consultas/actions";
import { linkWhatsapp, mensajeConsultaWeb } from "@/lib/whatsapp";
import type { ConsultaConFecha } from "@/lib/data/consultas";
import { ESTADOS_CONSULTA, ESTADO_CONSULTA_LABEL, type EstadoConsulta } from "@/lib/types/consulta";

export type VistaConsultas = "abiertas" | EstadoConsulta | "todas";

const TONO: Record<EstadoConsulta, "rojo" | "premium" | "positivo" | "neutro"> = {
  nueva: "rojo",
  en_contacto: "premium",
  concretada: "positivo",
  descartada: "neutro",
};

function FichaConsulta({ consulta }: { consulta: ConsultaConFecha }) {
  const [isPending, startTransition] = useTransition();
  const [notas, setNotas] = useState(consulta.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const notasCambiadas = notas.trim() !== (consulta.notas ?? "").trim();

  const ejecutar = (accion: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await accion();
      if (r.error) setError(r.error);
    });
  };

  return (
    <Card className={`flex flex-col gap-3 ${consulta.estado === "descartada" ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base sm:text-lg font-semibold text-texto">{consulta.nombre}</h2>
            <Badge tono={TONO[consulta.estado]}>{ESTADO_CONSULTA_LABEL[consulta.estado]}</Badge>
            {consulta.cliente_id && (
              <Link href={`/clientes/${consulta.cliente_id}`} className="inline-flex items-center gap-1 text-xs text-dorado hover:underline">
                <UserRound size={12} /> Ya es cliente
              </Link>
            )}
          </div>
          <p className="mt-0.5 text-xs text-texto-secundario">Llegó el {consulta.fecha_texto} desde la web</p>
        </div>
        <select
          aria-label="Estado de la consulta"
          value={consulta.estado}
          disabled={isPending}
          onChange={(e) => ejecutar(() => cambiarEstadoConsulta(consulta.id, e.target.value as EstadoConsulta))}
          className="campo sm:w-44 sm:shrink-0"
        >
          {ESTADOS_CONSULTA.map((e) => (
            <option key={e} value={e}>
              {ESTADO_CONSULTA_LABEL[e]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-texto-secundario">
        <span className="inline-flex items-center gap-1.5">
          <Phone size={14} className="shrink-0" /> {consulta.telefono}
        </span>
        {consulta.email && (
          <a href={`mailto:${consulta.email}`} className="inline-flex min-w-0 items-center gap-1.5 break-all hover:text-texto">
            <Mail size={14} className="shrink-0" /> {consulta.email}
          </a>
        )}
        {consulta.servicio && (
          <span className="inline-flex items-center gap-1.5">
            <Wrench size={14} className="shrink-0" /> {consulta.servicio}
          </span>
        )}
        {consulta.vehiculo && (
          <span className="inline-flex items-center gap-1.5">
            <Car size={14} className="shrink-0" /> {consulta.vehiculo}
          </span>
        )}
      </div>

      {consulta.mensaje && (
        <p className="whitespace-pre-line break-words rounded-lg border border-borde bg-panel-2 px-3 py-2.5 text-sm text-texto">
          {consulta.mensaje}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={`notas-${consulta.id}`} className="text-xs text-texto-secundario">
          Notas internas
        </label>
        <textarea
          id={`notas-${consulta.id}`}
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej.: le pasé precio de PPF full front, vuelve a escribir la semana que viene"
          className="campo resize-y"
        />
      </div>

      {error && (
        <p className="text-sm text-rojo" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-borde pt-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`¿Eliminar la consulta de ${consulta.nombre}? No se puede deshacer.`)) {
              ejecutar(() => eliminarConsulta(consulta.id));
            }
          }}
          className="inline-flex items-center justify-center gap-1.5 py-2 text-xs text-texto-secundario hover:text-rojo disabled:opacity-50"
        >
          <Trash2 size={14} /> Eliminar
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {notasCambiadas && (
            <Button variante="secundario" disabled={isPending} onClick={() => ejecutar(() => guardarNotasConsulta(consulta.id, notas))}>
              Guardar notas
            </Button>
          )}
          <a
            href={linkWhatsapp(consulta.telefono, mensajeConsultaWeb(consulta.nombre, consulta.servicio))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (consulta.estado === "nueva") ejecutar(() => marcarConsultaContactada(consulta.id));
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-verde px-4 py-2 text-sm font-medium text-fondo hover:brightness-110"
          >
            <MessageCircle size={16} />
            Escribirle por WhatsApp
          </a>
        </div>
      </div>
    </Card>
  );
}

const VISTAS: { id: VistaConsultas; label: string }[] = [
  { id: "abiertas", label: "Abiertas" },
  { id: "nueva", label: "Nuevas" },
  { id: "en_contacto", label: "En contacto" },
  { id: "concretada", label: "Concretadas" },
  { id: "descartada", label: "Descartadas" },
  { id: "todas", label: "Todas" },
];

export function ConsultasClient({
  consultas,
  conteo,
  vista,
}: {
  consultas: ConsultaConFecha[];
  conteo: Record<EstadoConsulta, number>;
  vista: VistaConsultas;
}) {
  const cantidad = (v: VistaConsultas) =>
    v === "abiertas"
      ? conteo.nueva + conteo.en_contacto
      : v === "todas"
        ? Object.values(conteo).reduce((a, b) => a + b, 0)
        : conteo[v];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-texto">Consultas web</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Lo que llega desde el formulario de Contacto de la web de JMF Detailing. Escribile por WhatsApp, anotá cómo
          sigue y marcá si se concretó.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {VISTAS.map((v) => (
          <Link
            key={v.id}
            href={v.id === "abiertas" ? "/consultas" : `/consultas?vista=${v.id}`}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
              vista === v.id
                ? "border-rojo/40 bg-rojo/10 text-rojo"
                : "border-borde text-texto-secundario hover:text-texto"
            }`}
          >
            {v.label}
            <span className="tabular-nums text-xs opacity-80">{cantidad(v.id)}</span>
          </Link>
        ))}
      </div>

      {consultas.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">No hay consultas acá.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Cuando alguien complete el formulario de Contacto de la web, va a aparecer en esta lista y con un aviso en
            Inicio.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {consultas.map((c) => (
            <FichaConsulta key={c.id} consulta={c} />
          ))}
        </div>
      )}
    </div>
  );
}
