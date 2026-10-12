import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  return (
    <header className="relative z-50 flex items-center justify-between gap-3 h-14 md:h-16 px-4 md:px-6 border-b border-borde bg-fondo-2 shrink-0">
      <Link href="/" className="flex items-center md:hidden">
        <Image src="/brands/detailing-logo.png" alt="CRM JMF Detailing" width={392} height={93} className="h-7 w-auto" priority />
      </Link>

      <div className="hidden md:block" />

      <MobileNav />

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
