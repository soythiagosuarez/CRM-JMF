import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions";

export function Topbar() {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-borde bg-fondo-2 shrink-0">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-display text-sm font-semibold">
          JMF · Centro de Operaciones
        </span>
      </div>

      <div className="hidden md:block" />

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="flex items-center gap-2 text-sm text-texto-secundario hover:text-rojo transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </form>
    </header>
  );
}
