import { ReactNode } from "react";

type Tono = "neutro" | "positivo" | "negativo" | "premium" | "rojo";

const tonoClase: Record<Tono, string> = {
  neutro: "bg-panel-2 text-texto-secundario border-borde",
  positivo: "bg-verde/10 text-verde border-verde/30",
  negativo: "bg-rojo/10 text-rojo border-rojo/30",
  premium: "bg-dorado/10 text-dorado border-dorado/30",
  rojo: "bg-rojo/10 text-rojo border-rojo/30",
};

export function Badge({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: Tono;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tonoClase[tono]}`}
    >
      {children}
    </span>
  );
}
