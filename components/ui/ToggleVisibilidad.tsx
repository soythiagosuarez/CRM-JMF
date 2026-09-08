"use client";

import { Eye, EyeOff } from "lucide-react";
import { useVisibilidadFinanciera } from "@/components/providers/VisibilidadProvider";

/** Botón de "ojo" para tapar/mostrar los montos de la pantalla — el
 * estado es compartido en toda la plataforma (ver VisibilidadProvider). */
export function ToggleVisibilidad() {
  const { oculto, alternar } = useVisibilidadFinanciera();
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oculto ? "Mostrar montos" : "Ocultar montos"}
      className="text-texto-secundario hover:text-texto"
    >
      {oculto ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}
