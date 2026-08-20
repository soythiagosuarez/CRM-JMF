"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navGroups, configItem } from "./nav-items";

function ItemLink({
  href,
  label,
  Icon,
  activo,
}: {
  href: string;
  label: string;
  Icon: (typeof navGroups)[number]["items"][number]["icon"];
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        activo
          ? "bg-rojo/10 text-rojo font-medium border border-rojo/30"
          : "text-texto-secundario hover:bg-panel-2 hover:text-texto border border-transparent"
      }`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 border-r border-borde bg-fondo-2 h-full">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-borde">
        <Image
          src="/logo-isotipo.svg"
          alt=""
          width={28}
          height={28}
          priority
        />
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-texto">
            Centro de
          </p>
          <p className="font-display text-sm font-semibold text-texto -mt-0.5">
            Operaciones
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {navGroups.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-texto-secundario">
              {grupo.titulo}
            </p>
            <div className="flex flex-col gap-1">
              {grupo.items.map((item) => (
                <ItemLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  activo={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-borde">
        <ItemLink
          href={configItem.href}
          label={configItem.label}
          Icon={configItem.icon}
          activo={pathname === configItem.href}
        />
      </div>
    </aside>
  );
}
