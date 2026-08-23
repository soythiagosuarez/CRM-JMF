import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Tarjeta base del sistema: fondo panel #1B1B1B, borde sutil.
 * Todas las pantallas del Centro de Operaciones se arman con esta pieza.
 */
export function Card({ children, className = "", onClick, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-borde bg-panel p-5 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-texto">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-texto-secundario mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
