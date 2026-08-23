import { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const variantes: Record<Variante, string> = {
  primario: "bg-rojo text-white hover:brightness-110",
  secundario:
    "bg-panel-2 text-texto border border-borde hover:border-rojo",
  fantasma: "bg-transparent text-texto-secundario hover:text-texto",
};

export function Button({
  variante = "primario",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantes[variante]} ${className}`}
      {...props}
    />
  );
}
