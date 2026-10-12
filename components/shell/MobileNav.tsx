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
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm leading-tight transition-colors ${
        activo
          ? "bg-rojo/10 text-rojo font-medium border border-rojo/30"
          : "text-texto-secundario hover:bg-panel-2 hover:text-texto border border-transparent"
      }`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="min-w-0">{item.label}</span>
    </Link>
  );
}

/**
 * Navegación del CRM en celulares: el Sidebar se oculta por debajo de md,
 * así que el header muestra el botón de menú a la derecha. El menú baja
 * desde el header, ocupa todo el ancho y solo el alto que necesita; el
 * botón se convierte en la X en el mismo lugar.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [rutaAlAbrir, setRutaAlAbrir] = useState(pathname);

  // Al navegar a otra sección el menú se cierra solo.
  if (abierto && pathname !== rutaAlAbrir) {
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRutaAlAbrir(pathname);
          setAbierto((a) => !a);
        }}
        className="md:hidden -mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-texto hover:bg-panel-2"
        aria-expanded={abierto}
        aria-controls="menu-movil"
      >
        {abierto ? <X size={22} /> : <Menu size={22} />}
        <span className="sr-only">{abierto ? "Cerrar menú" : "Abrir menú"}</span>
      </button>

      {abierto && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAbierto(false)} />
          <nav
            id="menu-movil"
            aria-label="Menú"
            className="menu-movil relative max-h-full overflow-y-auto border-b border-borde bg-fondo-2 px-4 pt-3 pb-4 shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              {navGroups.map((grupo) => (
                <div key={grupo.titulo}>
                  <p className="px-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-texto-secundario">
                    {grupo.titulo}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {grupo.items.map((item) => (
                      <ItemMovil key={item.href} item={item} activo={esRutaActiva(pathname, item.href)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 border-t border-borde pt-3">
              <ItemMovil item={configItem} activo={esRutaActiva(pathname, configItem.href)} />
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2.5 text-sm text-texto-secundario hover:bg-panel-2 hover:text-rojo"
                >
                  <LogOut size={18} className="shrink-0" />
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
