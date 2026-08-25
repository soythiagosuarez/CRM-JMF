import Link from "next/link";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExportarCsvButton } from "@/components/finanzas/ExportarCsvButton";
import { obtenerReporteMes } from "@/lib/data/reportes";
import { formatARS } from "@/lib/format";
import { MARCA_LABEL, type MarcaMovimiento } from "@/lib/types/movimiento";

const MARCAS_ORDEN: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function mesAdyacente(referencia: string, delta: number): string {
  const [anio, mes] = referencia.split("-").map(Number);
  const d = new Date(anio, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const hoy = new Date();
  const mesActual = params.mes ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const reporte = await obtenerReporteMes(mesActual);
  const [anio, mesNum] = mesActual.split("-").map(Number);
  const etiquetaMes = `${MESES[mesNum - 1]} ${anio}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Reportes</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Resumen del mes: facturación, marca y servicio más rentable.
          </p>
        </div>
        <ExportarCsvButton
          movimientos={reporte.movimientos}
          nombreArchivo={`movimientos-${mesActual}`}
        />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/reportes?mes=${mesAdyacente(mesActual, -1)}`}
          className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
        >
          <ChevronLeft size={16} />
        </Link>
        <Link
          href={`/reportes?mes=${mesAdyacente(mesActual, 1)}`}
          className="rounded-lg border border-borde p-1.5 text-texto-secundario hover:text-texto hover:border-rojo/50"
        >
          <ChevronRight size={16} />
        </Link>
        <span className="font-display text-base font-semibold text-texto capitalize ml-2">
          {etiquetaMes}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-sm text-texto-secundario">Facturación</span>
          <p className="font-display text-2xl font-semibold text-verde mt-1">
            {formatARS(reporte.facturacion)}
          </p>
        </Card>
        <Card>
          <span className="text-sm text-texto-secundario">Egresos</span>
          <p className="font-display text-2xl font-semibold text-rojo mt-1">
            {formatARS(reporte.egresos)}
          </p>
        </Card>
        <Card>
          <span className="text-sm text-texto-secundario">Neto</span>
          <p
            className={`font-display text-2xl font-semibold mt-1 ${
              reporte.neto > 0 ? "text-verde" : reporte.neto < 0 ? "text-rojo" : "text-texto-secundario"
            }`}
          >
            {formatARS(reporte.neto)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-start gap-3">
          <Trophy size={20} className="text-dorado shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-texto-secundario">Marca más rentable</p>
            {reporte.marcaMasRentable ? (
              <>
                <p className="font-display text-lg font-semibold text-texto">
                  {reporte.marcaMasRentable.marca}
                </p>
                <p className="text-xs text-texto-secundario">
                  {formatARS(reporte.marcaMasRentable.neto)} de neto
                </p>
              </>
            ) : (
              <p className="text-sm text-texto-secundario">Sin datos este mes.</p>
            )}
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <Trophy size={20} className="text-dorado shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-texto-secundario">Servicio más rentable</p>
            {reporte.servicioMasRentable ? (
              <>
                <p className="font-display text-lg font-semibold text-texto">
                  {reporte.servicioMasRentable.servicio}
                </p>
                <p className="text-xs text-texto-secundario">
                  {formatARS(reporte.servicioMasRentable.monto)} facturados
                </p>
              </>
            ) : (
              <p className="text-sm text-texto-secundario">Sin órdenes cobradas este mes.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Facturación por marca" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-texto-secundario uppercase tracking-wide border-b border-borde">
                <th className="py-2 pr-3">Destino/marca</th>
                <th className="py-2 pr-3">Ingreso, egreso y neto</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde/60">
              {MARCAS_ORDEN.map((marca) => {
                const t = reporte.porMarca.get(marca)!;
                const enRojo = t.neto < 0;
                return (
                  <tr key={marca}>
                    <td className="py-3 pr-3 text-texto">{MARCA_LABEL[marca]}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-texto-secundario">
                          +{formatARS(t.ingresos)} / -{formatARS(t.egresos)}
                        </span>
                        <Badge tono={enRojo ? "negativo" : "positivo"}>{formatARS(t.neto)}</Badge>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/reportes/${marca}?mes=${mesActual}`}
                        aria-label={`Ver desglose de ${MARCA_LABEL[marca]}`}
                        className="inline-flex items-center gap-1 text-xs text-rojo hover:underline"
                      >
                        Ver
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
