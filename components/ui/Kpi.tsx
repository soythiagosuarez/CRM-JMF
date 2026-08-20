import { ReactNode } from "react";
import { Card } from "./Card";

type Tono = "neutro" | "positivo" | "negativo" | "premium";

const tonoColor: Record<Tono, string> = {
  neutro: "text-texto",
  positivo: "text-verde",
  negativo: "text-rojo",
  premium: "text-dorado",
};

interface KpiProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono?: Tono;
  icono?: ReactNode;
}

/**
 * Tarjeta de indicador clave (KPI) para el dashboard de Inicio y otras pantallas.
 */
export function Kpi({ etiqueta, valor, detalle, tono = "neutro", icono }: KpiProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-texto-secundario">{etiqueta}</span>
        {icono && <span className="text-texto-secundario">{icono}</span>}
      </div>
      <span className={`font-display text-2xl font-semibold ${tonoColor[tono]}`}>
        {valor}
      </span>
      {detalle && <span className="text-xs text-texto-secundario">{detalle}</span>}
    </Card>
  );
}
