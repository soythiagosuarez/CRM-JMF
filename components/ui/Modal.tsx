"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl sm:rounded-xl border border-borde bg-panel p-4 sm:p-5 max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-display text-lg font-semibold text-texto">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-texto-secundario hover:text-texto"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
