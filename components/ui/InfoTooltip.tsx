"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/**
 * Ícono de info que al clickearlo abre una card con el texto — reemplaza
 * los textos de ayuda fijos que quedaban cortados en varias líneas
 * (§ feedback: "el tooltip sea interactivo y muestre la info en una card").
 */
export function InfoTooltip({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const onClickFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onEscape);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más información"
        aria-expanded={abierto}
        className="text-texto-secundario hover:text-texto"
      >
        <Info size={16} />
      </button>
      {abierto && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2 z-20 w-64 rounded-lg border border-borde bg-panel p-3 text-xs text-texto-secundario shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
