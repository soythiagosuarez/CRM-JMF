import Link from "next/link";
import { Gift } from "lucide-react";
import { BotonAvisarPremio } from "@/components/clientes/BotonAvisarPremio";
import type { AlertaPremio } from "@/lib/types/fidelizacion";

/**
 * Clientes que llegaron a un premio y todavía no se les avisó, o que no
 * respondieron en 15 días (respuestas 12.1 y 12.4). Desaparece solo
 * cuando se les avisa.
 */
export function AlertaFidelizacion({ alertas }: { alertas: AlertaPremio[] }) {
  if (alertas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((a) => (
        <div
          key={a.clienteId}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-dorado/40 bg-dorado/10 px-4 py-3"
        >
          <p className="flex items-start gap-2 text-sm text-texto min-w-0">
            <Gift size={16} className="text-dorado shrink-0 mt-0.5" />
            <span>
              <Link href={`/clientes/${a.clienteId}`} className="font-medium hover:underline">
                {a.nombre}
              </Link>{" "}
              {a.reaviso ? "no respondió el aviso y sigue con" : "juntó"} {a.saldo} puntos: puede canjear{" "}
              {a.premios.join(", ")}.
            </span>
          </p>
          <div className="shrink-0 pl-6 sm:pl-0">
            <BotonAvisarPremio
              clienteId={a.clienteId}
              nombre={a.nombre}
              telefono={a.telefono}
              saldo={a.saldo}
              premios={a.premios}
              reaviso={a.reaviso}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
