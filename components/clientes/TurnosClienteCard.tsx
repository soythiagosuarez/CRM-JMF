import { CalendarDays } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatFecha } from "@/lib/format";
import { ESTADO_TURNO_LABEL, type EstadoTurno, type TurnoConDatos } from "@/lib/types/turno";

const TONO: Record<EstadoTurno, "neutro" | "positivo" | "negativo" | "premium"> = {
  agendado: "neutro",
  a_confirmar: "premium",
  ingresado: "positivo",
  cancelado: "neutro",
  no_vino: "negativo",
};

/** Turnos del cliente, con los "no vino" a la vista (respuesta 7.4). */
export function TurnosClienteCard({ turnos }: { turnos: TurnoConDatos[] }) {
  const noVino = turnos.filter((t) => t.estado === "no_vino").length;

  return (
    <Card>
      <CardHeader
        title="Turnos"
        subtitle={noVino > 0 ? `No vino ${noVino} ${noVino === 1 ? "vez" : "veces"}` : undefined}
      />
      {turnos.length === 0 ? (
        <p className="text-sm text-texto-secundario">Todavía no tiene turnos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {turnos.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-panel-2 p-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <CalendarDays size={14} className="text-texto-secundario mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-texto truncate">{t.servicios_nombres.join(" + ")}</p>
                  <p className="text-xs text-texto-secundario mt-0.5">
                    {formatFecha(t.fecha + "T00:00:00")} · {t.hora.slice(0, 5)} hs
                    {t.vehiculo_descripcion ? ` · ${t.vehiculo_descripcion}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {t.origen === "online" && <Badge tono="rojo">Online</Badge>}
                <Badge tono={TONO[t.estado]}>{ESTADO_TURNO_LABEL[t.estado]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
