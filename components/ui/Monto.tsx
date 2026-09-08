"use client";

import { useVisibilidadFinanciera } from "@/components/providers/VisibilidadProvider";
import { formatARS } from "@/lib/format";

/** Muestra un monto en ARS, o lo tapa si el usuario activó "ocultar
 * montos" (ver ToggleVisibilidad). El ancho del placeholder es fijo
 * para que no salte el layout al alternar. */
export function Monto({ valor, className }: { valor: number; className?: string }) {
  const { oculto } = useVisibilidadFinanciera();
  return <span className={className}>{oculto ? "••••••" : formatARS(valor)}</span>;
}
