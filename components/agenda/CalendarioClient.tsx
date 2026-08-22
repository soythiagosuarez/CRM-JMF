"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Gauge, PartyPopper, CalendarX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TurnoForm } from "./TurnoForm";
import { TurnoPopup } from "./TurnoPopup";
import { AutoForm as AutoClassmotorForm } from "@/components/classmotor/AutoForm";
import { crearAutoClassmotor } from "@/app/(app)/classmotor/actions";
import {
  rangoMes,
  rangoSemana,
  diasDelRango,
  addMeses,
  addSemanas,
  addDiasISO,
  hoyISO,
  nombreMesAnio,
  nombreDiaCorto,
  nombreDiaLargo,
  etiquetaRangoSemana,
  esHoy,
} from "@/lib/agenda-dates";
import type { TurnoConDatos } from "@/lib/types/turno";
import type { ClienteConVehiculos } from "@/lib/types/cliente";
import type { Servicio } from "@/lib/types/servicio";

type Vista = "mes" | "semana" | "dia";

const CHIP_TONO: Record<TurnoConDatos["estado"], string> = {
  agendado: "bg-panel-2 text-texto border-borde",
  ingresado: "bg-verde/10 text-verde border-verde/30",
  cancelado: "bg-rojo/10 text-rojo/70 border-rojo/20 line-through opacity-60",
};

export function CalendarioClient({
  turnos,
  clientes,
  servicios,
  vista,
  fecha,
  cantidadTurnosHoy,
}: {
  turnos: TurnoConDatos[];
  clientes: ClienteConVehiculos[];
  servicios: Servicio[];
  vista: Vista;
  fecha: string;
  cantidadTurnosHoy: number;
}) {
  const router = useRouter();
  const [turnoAbierto, setTurnoAbierto] = useState<TurnoConDatos | null>(null);
  const [fechaNuevoTurno, setFechaNuevoTurno] = useState<string | null>(null);
  const [ingresandoClassmotor, setIngresandoClassmotor] = useState(false);

  const porDia = useMemo(() => {
    const mapa = new Map<string, TurnoConDatos[]>();
    for (const t of turnos) {
      if (!mapa.has(t.fecha)) mapa.set(t.fecha, []);
      mapa.get(t.fecha)!.push(t);
    }
    return mapa;
  }, [turnos]);

  const irA = (nuevaVista: Vista, nuevaFecha: string) => {
    router.push(`/agenda?vista=${nuevaVista}&fecha=${nuevaFecha}`);
  };

  const anterior = () => {
    if (vista === "mes") irA("mes", addMeses(fecha, -1));
    else if (vista === "semana") irA("semana", addSemanas(fecha, -1));
    else irA("dia", addDiasISO(fecha, -1));
  };

  const siguiente = () => {
    if (vista === "mes") irA("mes", addMeses(fecha, 1));
    else if (vista === "semana") irA("semana", addSemanas(fecha, 1));
    else irA("dia", addDiasISO(fecha, 1));
  };

  const etiqueta = useMemo(() => {
    if (vista === "mes") return nombreMesAnio(fecha);
    if (vista === "semana") {
      const { desde, hasta } = rangoSemana(fecha);
      return etiquetaRangoSemana(desde, hasta);
    }
    return nombreDiaLargo(fecha);
  }, [vista, fecha]);

  const diasAMostrar = useMemo(() => {
    if (vista === "mes") {
      const { desde, hasta } = rangoMes(fecha);
      return diasDelRango(desde, hasta);
    }
    if (vista === "semana") {
      const { desde, hasta } = rangoSemana(fecha);
      return diasDelRango(desde, hasta);
    }
    return [fecha];
  }, [vista, fecha]);

  const mesActual = fromMesActual(fecha, vista);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Agenda</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Turnos de servicio confirmados. Lun a vie 9–18 · Sáb 10–13.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variante="secundario" onClick={() => setIngresandoClassmotor(true)}>
            <Gauge size={16} />
            Ingresar auto Classmotor
          </Button>
          <Button onClick={() => setFechaNuevoTurno(fecha)}>
            <Plus size={16} />
            Nuevo turno detailing
          </Button>
        </div>
      </div>

      <BannerHoy cantidad={cantidadTurnosHoy} />

      {servicios.length === 0 && (
        <Card className="text-sm text-texto-secundario">
          Cargá al menos un servicio activo en{" "}
          <a href="/servicios" className="text-rojo hover:underline">
            Servicios
          </a>{" "}
          antes de agendar turnos.
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={anterior}
            aria-label="Anterior"
            className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={siguiente}
            aria-label="Siguiente"
            className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => irA(vista, hoyISO())}
            className="rounded-lg border border-borde px-3 py-1.5 text-sm text-texto-secundario hover:text-texto hover:border-rojo/50"
          >
            Hoy
          </button>
          <span className="font-display text-base font-semibold text-texto capitalize ml-2">
            {etiqueta}
          </span>
        </div>

        <div className="flex rounded-lg border border-borde overflow-hidden">
          {(["mes", "semana", "dia"] as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => irA(v, fecha)}
              className={`px-3 py-1.5 text-sm capitalize ${
                vista === v
                  ? "bg-rojo/10 text-rojo"
                  : "text-texto-secundario hover:text-texto"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div
        className={
          vista === "dia"
            ? "grid grid-cols-1"
            : "grid grid-cols-1 sm:grid-cols-7 gap-3"
        }
      >
        {diasAMostrar.map((dia) => (
          <DiaCelda
            key={dia}
            dia={dia}
            turnos={(porDia.get(dia) ?? []).filter((t) =>
              vista === "mes" ? t.estado !== "cancelado" : true
            )}
            mostrarEncabezado
            atenuado={vista === "mes" && !esDelMesActual(dia, mesActual)}
            compacto={vista === "mes"}
            onVerTurno={setTurnoAbierto}
            onVerDia={(d) => irA("dia", d)}
            onCrearEnDia={setFechaNuevoTurno}
          />
        ))}
      </div>

      {turnoAbierto && (
        <TurnoPopup turno={turnoAbierto} onCerrar={() => setTurnoAbierto(null)} />
      )}

      {fechaNuevoTurno && (
        <Modal titulo="Nuevo turno detailing" onCerrar={() => setFechaNuevoTurno(null)}>
          <TurnoForm
            clientes={clientes}
            servicios={servicios}
            fechaInicial={fechaNuevoTurno}
            onCancelar={() => setFechaNuevoTurno(null)}
            onGuardado={() => setFechaNuevoTurno(null)}
          />
        </Modal>
      )}

      {ingresandoClassmotor && (
        <Modal titulo="Ingresar auto Classmotor" onCerrar={() => setIngresandoClassmotor(false)}>
          <AutoClassmotorForm
            accion={crearAutoClassmotor}
            onCancelar={() => setIngresandoClassmotor(false)}
            onGuardado={() => setIngresandoClassmotor(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function BannerHoy({ cantidad }: { cantidad: number }) {
  if (cantidad > 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-verde/30 bg-verde/10 px-4 py-3">
        <PartyPopper size={18} className="text-verde shrink-0" />
        <p className="text-sm text-texto">
          <span className="font-medium text-verde">
            ¡Hoy el taller tiene {cantidad} {cantidad === 1 ? "turno" : "turnos"}!
          </span>{" "}
          Buen ritmo para el día.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-borde bg-panel-2 px-4 py-3">
      <CalendarX size={18} className="text-texto-secundario shrink-0" />
      <p className="text-sm text-texto-secundario">
        Hoy todavía no hay turnos agendados.
      </p>
    </div>
  );
}

function fromMesActual(fecha: string, vista: Vista): number {
  if (vista !== "mes") return -1;
  return rangoMes(fecha).primerDiaMes.getMonth();
}

function esDelMesActual(dia: string, mes: number): boolean {
  return new Date(dia + "T00:00:00").getMonth() === mes;
}

/**
 * Celda de un día, usada por igual en las 3 vistas para que compartan la
 * misma estética: header con nombre+número de día, chips de turnos, y un
 * botón "+ Agregar" siempre visible. En "mes" es compacta (limita chips
 * visibles y no repite el header con nombre completo de fecha).
 */
function DiaCelda({
  dia,
  turnos,
  mostrarEncabezado,
  atenuado,
  compacto,
  onVerTurno,
  onVerDia,
  onCrearEnDia,
}: {
  dia: string;
  turnos: TurnoConDatos[];
  mostrarEncabezado: boolean;
  atenuado: boolean;
  compacto: boolean;
  onVerTurno: (t: TurnoConDatos) => void;
  onVerDia: (fecha: string) => void;
  onCrearEnDia: (fecha: string) => void;
}) {
  const MAX_VISIBLES = 4;
  const visibles = compacto ? turnos.slice(0, MAX_VISIBLES) : turnos;
  const restantes = compacto ? turnos.length - visibles.length : 0;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-borde p-2.5 ${
        compacto ? "min-h-[110px]" : "min-h-[140px]"
      } ${atenuado ? "bg-fondo-2" : "bg-panel"}`}
    >
      {mostrarEncabezado && (
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xs uppercase tracking-wide ${
                atenuado ? "text-texto-secundario/60" : "text-texto-secundario"
              }`}
            >
              {nombreDiaCorto(dia)}
            </span>
            <span
              className={
                esHoy(dia)
                  ? "inline-flex items-center justify-center w-5 h-5 rounded-full bg-rojo text-xs font-medium text-white"
                  : `text-xs font-medium ${atenuado ? "text-texto-secundario" : "text-texto"}`
              }
            >
              {Number(dia.slice(8, 10))}
            </span>
          </div>
          <button
            onClick={() => onCrearEnDia(dia)}
            aria-label="Agregar turno"
            className="text-texto-secundario hover:text-rojo"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1 flex-1">
        {visibles.map((t) =>
          compacto ? (
            <ChipCompacto key={t.id} turno={t} onClick={() => onVerTurno(t)} />
          ) : (
            <ChipDetallado key={t.id} turno={t} onClick={() => onVerTurno(t)} />
          )
        )}
        {restantes > 0 && (
          <button
            onClick={() => onVerDia(dia)}
            className="text-xs text-texto-secundario hover:text-rojo text-left"
          >
            +{restantes} más
          </button>
        )}
      </div>

      {!compacto && (
        <button
          onClick={() => onCrearEnDia(dia)}
          className="text-xs text-texto-secundario hover:text-rojo text-left border border-dashed border-borde rounded px-1.5 py-1"
        >
          + Agregar
        </button>
      )}
    </div>
  );
}

function ChipCompacto({ turno, onClick }: { turno: TurnoConDatos; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full truncate rounded border px-1.5 py-0.5 text-left text-xs ${CHIP_TONO[turno.estado]}`}
    >
      {turno.hora.slice(0, 5)} {turno.cliente_nombre}
    </button>
  );
}

function ChipDetallado({ turno, onClick }: { turno: TurnoConDatos; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded border px-2 py-1.5 text-left text-xs ${CHIP_TONO[turno.estado]}`}
    >
      <p className="font-medium">
        {turno.hora.slice(0, 5)} · {turno.cliente_nombre}
      </p>
      <p className="truncate opacity-80">
        {turno.vehiculo_descripcion} · {turno.servicios_nombres.join(", ")}
      </p>
    </button>
  );
}
