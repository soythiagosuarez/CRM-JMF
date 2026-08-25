import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExportarCsvButton } from "@/components/finanzas/ExportarCsvButton";
import { obtenerReporteMarca } from "@/lib/data/reportes";
import { formatARS, formatFecha } from "@/lib/format";
import { MARCA_LABEL, type MarcaMovimiento } from "@/lib/types/movimiento";

const MARCAS_VALIDAS: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ReporteMarcaPage({
  params,
  searchParams,
}: {
  params: Promise<{ marca: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { marca: marcaParam } = await params;
  if (!MARCAS_VALIDAS.includes(marcaParam as MarcaMovimiento)) notFound();
  const marca = marcaParam as MarcaMovimiento;

  const { mes } = await searchParams;
  const hoy = new Date();
  const mesActual = mes ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const [anio, mesNum] = mesActual.split("-").map(Number);
  const etiquetaMes = `${MESES[mesNum - 1]} ${anio}`;

  const reporte = await obtenerReporteMarca(mesActual, marca);
  const enRojo = reporte.neto < 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href={`/reportes?mes=${mesActual}`}
            className="inline-flex items-center gap-1.5 text-sm text-texto-secundario hover:text-texto mb-2"
          >
            <ChevronLeft size={14} />
            Volver a Reportes
          </Link>
          <h1 className="font-display text-2xl font-semibold text-texto">
            {MARCA_LABEL[marca]}
          </h1>
          <p className="text-sm text-texto-secundario mt-1 capitalize">
            Desglose de {etiquetaMes}.
          </p>
        </div>
        <ExportarCsvButton
          movimientos={reporte.movimientos}
          nombreArchivo={`movimientos-${marca}-${mesActual}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-sm text-texto-secundario">Ingresos</span>
          <p className="font-display text-2xl font-semibold text-verde mt-1">
            {formatARS(reporte.ingresos)}
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
              enRojo ? "text-rojo" : reporte.neto > 0 ? "text-verde" : "text-texto-secundario"
            }`}
          >
            {formatARS(reporte.neto)}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Movimientos del mes" />
        {reporte.movimientos.length === 0 ? (
          <p className="text-sm text-texto-secundario py-8 text-center">
            No hay movimientos de {MARCA_LABEL[marca]} en {etiquetaMes}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-texto-secundario uppercase tracking-wide border-b border-borde">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Categoría</th>
                  <th className="py-2 pr-3">Descripción</th>
                  <th className="py-2 pr-3">Tipo</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde/60">
                {reporte.movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3 text-texto-secundario whitespace-nowrap">
                      {formatFecha(m.fecha)}
                    </td>
                    <td className="py-2 pr-3 text-texto">{m.categoria}</td>
                    <td className="py-2 pr-3 text-texto-secundario truncate max-w-[16rem]">
                      {m.descripcion ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tono={m.tipo === "ingreso" ? "positivo" : "negativo"}>
                        {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right text-texto whitespace-nowrap">
                      {formatARS(m.monto_ars)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
