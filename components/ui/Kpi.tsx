import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  enlace?: { href: string; texto: string };
}

/**
 * Tarjeta de indicador clave (KPI) para el dashboard de Inicio y otras pantallas.
 */
export function Kpi({ etiqueta, valor, detalle, tono = "neutro", icono, enlace }: KpiProps) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-texto-secundario">{etiqueta}</span>
        {enlace ? (
          <Link
            href={enlace.href}
            className="flex items-center gap-1 text-xs text-rojo hover:underline"
          >
            {enlace.texto}
            <ArrowRight size={12} />
          </Link>
        ) : (
          icono && <span className="text-texto-secundario">{icono}</span>
        )}
      </div>
      <span className={`font-display text-2xl font-semibold ${tonoColor[tono]}`}>
        {valor}
      </span>
      {detalle && <span className="text-xs text-texto-secundario">{detalle}</span>}
    </Card>
  );
}
