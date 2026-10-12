"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { navGroups, configItem, esRutaActiva, type NavItem } from "./nav-items";
import { cerrarSesion } from "@/app/login/actions";

function ItemMovil({ item, activo }: { item: NavItem; activo: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors ${
        activo
          ? "bg-rojo/10 text-rojo font-medium border border-rojo/30"
          : "text-texto-secundario hover:bg-panel-2 hover:text-texto border border-transparent"
      }`}
    >
      <Icon size={20} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/**
 * Navegación del CRM en celulares: el Sidebar se oculta por debajo de md,
 * así que el Topbar muestra un botón de menú que abre este panel lateral
 * con las mismas secciones.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaAlAbrir, setRutaAlAbrir] = useState(pathname);

  // Al navegar a otra sección el panel se cierra solo.
  if (abierto && pathname !== rutaAlAbrir) {
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRutaAlAbrir(pathname);
          setAbierto(true);
        }}
        className="md:hidden -ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-texto hover:bg-panel-2"
        aria-expanded={abierto}
        aria-controls="menu-movil"
      >
        <Menu size={22} />
        <span className="sr-only">Abrir menú</span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAbierto(false)} />
          <nav
            id="menu-movil"
            className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col border-r border-borde bg-fondo-2 shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-borde pl-5 pr-3">
              <p className="font-display text-base font-semibold text-texto leading-tight">
                Centro de Operaciones JMF
              </p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-texto-secundario hover:text-texto"
              >
                <X size={20} />
                <span className="sr-only">Cerrar menú</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
              {navGroups.map((grupo) => (
                <div key={grupo.titulo}>
                  <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-texto-secundario">
                    {grupo.titulo}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {grupo.items.map((item) => (
                      <ItemMovil key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-borde px-3 py-3 flex flex-col gap-0.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <ItemMovil item={configItem} activo={esRutaActiva(pathname, configItem.href)} />
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base text-texto-secundario hover:bg-panel-2 hover:text-rojo"
                >
                  <LogOut size={20} className="shrink-0" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
