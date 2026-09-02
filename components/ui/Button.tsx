import { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const variantes: Record<Variante, string> = {
  primario: "bg-rojo text-white hover:brightness-110",
  secundario:
    "bg-transparent text-rojo border border-rojo hover:brightness-110",
  fantasma: "bg-transparent text-texto-secundario hover:text-texto",
};

export function Button({
  variante = "primario",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:pointer-events-none disabled:!bg-panel-2 disabled:!text-texto-secundario disabled:!border disabled:!border-borde disabled:hover:!brightness-100 ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
