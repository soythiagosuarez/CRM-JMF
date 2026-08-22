import Link from "next/link";
import { MessageCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Badge } from "@/components/ui/Badge";
import { formatARS, formatFecha } from "@/lib/format";
import { linkWhatsapp, mensajeCambioFase, mensajeMantenimiento, mensajeRenovacion } from "@/lib/whatsapp";
import {
  kpisMock,
  finanzasPorMarcaMock,
  metaMesMock,
  autosEnTallerMock,
  mixServiciosMock,
  recordatoriosMock,
  flagLabel,
} from "@/lib/mock-data";

export default function InicioPage() {
  const netoMes = kpisMock.ingresosMes - kpisMock.egresosMes;
  const totalMixServicios = mixServiciosMock.reduce((acc, s) => acc + s.cantidad, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-texto">Inicio</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Resumen general de Detailing, Shop y Classmotor. Datos de ejemplo.
        </p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          etiqueta="Autos en el taller"
          valor={String(kpisMock.autosEnTaller)}
          enlace={{ href: "/autos", texto: "Gestionar autos" }}
        />
        <Kpi etiqueta="Ingresos del mes" valor={formatARS(kpisMock.ingresosMes)} tono="positivo" />
        <Kpi etiqueta="Egresos del mes" valor={formatARS(kpisMock.egresosMes)} tono="negativo" />
        <Kpi
          etiqueta="Neto del mes"
          valor={formatARS(netoMes)}
          tono={netoMes >= 0 ? "positivo" : "negativo"}
          detalle={netoMes >= 0 ? "El mes está en verde" : "El mes está en rojo"}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Finanzas por marca */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Finanzas por marca"
            subtitle="Ingresos, egresos y neto operativo de cada marca"
            action={
              <Link href="/finanzas" className="text-sm text-rojo hover:underline">
                Ver todo
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finanzasPorMarcaMock.map((m) => {
              const neto = m.ingresos - m.egresos;
              const enRojo = neto < 0;
              return (
                <div
                  key={m.marca}
                  className="rounded-lg border border-borde bg-panel-2 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-texto">{m.marca}</span>
                    {enRojo && (
                      <Badge tono="negativo">
                        <AlertTriangle size={12} className="mr-1" />
                        En rojo
                      </Badge>
                    )}
                  </div>
                  <span
                    className={`font-display text-xl font-semibold ${
                      enRojo ? "text-rojo" : "text-verde"
                    }`}
                  >
                    {formatARS(neto)}
                  </span>
                  <div className="flex justify-between text-xs text-texto-secundario">
                    <span>Ingresos {formatARS(m.ingresos)}</span>
                    <span>Egresos {formatARS(m.egresos)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Meta del mes */}
        <Card>
          <CardHeader title="Meta del mes" subtitle="Objetivo comercial de JMF" />
          <div className="flex flex-col gap-5">
            <MetaBarra
              etiqueta="PPF"
              actual={metaMesMock.ppf.actual}
              objetivo={metaMesMock.ppf.objetivo}
              unidad="por mes"
            />
            <MetaBarra
              etiqueta="Tratamiento cerámico"
              actual={metaMesMock.ceramicoSemana.actual}
              objetivo={metaMesMock.ceramicoSemana.objetivo}
              unidad="esta semana"
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Autos en el taller */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Autos en el taller"
            subtitle="Fase actual y estado de cada orden"
            action={
              <Link href="/autos" className="text-sm text-rojo hover:underline">
                Ver tablero
              </Link>
            }
          />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-texto-secundario border-b border-borde">
                  <th className="font-normal py-2 px-1">Cliente / Auto</th>
                  <th className="font-normal py-2 px-1">Servicio</th>
                  <th className="font-normal py-2 px-1">Fase</th>
                  <th className="font-normal py-2 px-1">Estado</th>
                  <th className="font-normal py-2 px-1 text-right">Avisar</th>
                </tr>
              </thead>
              <tbody>
                {autosEnTallerMock.map((a) => (
                  <tr key={a.id} className="border-b border-borde/60 last:border-0">
                    <td className="py-2.5 px-1">
                      <p className="text-texto">{a.cliente}</p>
                      <p className="text-texto-secundario text-xs">{a.auto}</p>
                    </td>
                    <td className="py-2.5 px-1 text-texto-secundario">{a.servicio}</td>
                    <td className="py-2.5 px-1 text-texto">{a.fase}</td>
                    <td className="py-2.5 px-1">
                      {a.flags.length === 0 ? (
                        <span className="text-texto-secundario text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {a.flags.map((f) => (
                            <Badge key={f} tono="negativo">
                              {flagLabel[f]}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-1 text-right">
                      <a
                        href={linkWhatsapp(a.telefono, mensajeCambioFase(a.cliente, a.auto, a.fase))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline"
                      >
                        <MessageCircle size={14} />
                        Avisar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mix de servicios */}
        <Card>
          <CardHeader title="Mix de servicios" subtitle="Órdenes del mes por tipo" />
          <div className="flex flex-col gap-3">
            {mixServiciosMock.map((s) => {
              const pct = totalMixServicios ? Math.round((s.cantidad / totalMixServicios) * 100) : 0;
              return (
                <div key={s.servicio}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-texto">{s.servicio}</span>
                    <span className="text-texto-secundario">{s.cantidad}</span>
                  </div>
                  <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rojo"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recordatorios */}
      <Card>
        <CardHeader
          title="Próximos recordatorios"
          subtitle="Mantenimientos y renovaciones que se vienen"
          action={
            <Link href="/recordatorios" className="text-sm text-rojo hover:underline">
              Ver todos
            </Link>
          }
        />
        <div className="flex flex-col divide-y divide-borde/60">
          {recordatoriosMock.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm text-texto">
                  {r.cliente} <span className="text-texto-secundario">· {r.auto}</span>
                </p>
                <p className="text-xs text-texto-secundario mt-0.5">
                  {r.tratamiento} · {r.tipo === "mantenimiento" ? "Mantenimiento" : "Renovación"} ·{" "}
                  {formatFecha(r.fechaProxima)}
                </p>
              </div>
              <a
                href={linkWhatsapp(
                  r.telefono,
                  r.tipo === "mantenimiento"
                    ? mensajeMantenimiento(r.cliente, r.tratamiento)
                    : mensajeRenovacion(r.cliente, r.tratamiento, r.auto)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-verde hover:underline shrink-0"
              >
                <MessageCircle size={14} />
                Recontactar
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetaBarra({
  etiqueta,
  actual,
  objetivo,
  unidad,
}: {
  etiqueta: string;
  actual: number;
  objetivo: number;
  unidad: string;
}) {
  const pct = Math.min(100, Math.round((actual / objetivo) * 100));
  const cumplida = actual >= objetivo;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-texto">{etiqueta}</span>
        <span className={`font-display text-sm font-semibold ${cumplida ? "text-dorado" : "text-texto"}`}>
          {actual}/{objetivo} <span className="text-xs text-texto-secundario font-sans font-normal">{unidad}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-panel-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${cumplida ? "bg-dorado" : "bg-rojo"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
