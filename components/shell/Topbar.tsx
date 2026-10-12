import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-3 h-14 md:h-16 px-4 md:px-6 border-b border-borde bg-fondo-2 shrink-0">
      <div className="flex items-center gap-1 min-w-0 md:hidden">
        <MobileNav />
        <span className="font-display text-base font-semibold truncate">JMF · Centro de Operaciones</span>
      </div>

      <div className="hidden md:block" />

      <form action={cerrarSesion} className="hidden md:block">
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
