import type { ReactNode } from "react";

/** Piezas chicas compartidas por los pasos de la agenda online. */

export function Campo({
  label,
  htmlFor,
  ayuda,
  opcional,
  children,
}: {
  label: string;
  htmlFor?: string;
  ayuda?: string;
  opcional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={htmlFor} className="text-sm text-texto">
        {label}
        {opcional && <span className="text-texto-secundario"> (opcional)</span>}
      </label>
      {children}
      {ayuda && <p className="text-xs text-texto-secundario">{ayuda}</p>}
    </div>
  );
}

export function Seccion({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-texto">{titulo}</h2>
        {subtitulo && <p className="text-sm text-texto-secundario mt-1">{subtitulo}</p>}
      </div>
      {children}
    </section>
  );
}

/** Opción grande tipo tarjeta (radio o checkbox con estilo). */
export function Opcion({
  seleccionada,
  onClick,
  children,
  className = "",
}: {
  seleccionada: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionada}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        seleccionada
          ? "border-rojo bg-rojo/10"
          : "border-borde bg-panel hover:border-texto-secundario/60"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Aviso({ tono = "neutro", children }: { tono?: "neutro" | "error" | "ok" | "premium"; children: ReactNode }) {
  const clases = {
    neutro: "border-borde bg-panel-2 text-texto-secundario",
    error: "border-rojo/40 bg-rojo/10 text-texto",
    ok: "border-verde/30 bg-verde/10 text-texto",
    premium: "border-dorado/40 bg-dorado/10 text-texto",
  }[tono];
  return (
    <div role={tono === "error" ? "alert" : undefined} className={`rounded-lg border px-4 py-3 text-sm ${clases}`}>
      {children}
    </div>
  );
}
