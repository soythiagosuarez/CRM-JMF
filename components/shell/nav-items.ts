import {
  LayoutDashboard,
  CalendarDays,
  Car,
  UserSearch,
  Wallet,
  ShoppingBag,
  Gauge,
  Users,
  Wrench,
  BellRing,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  titulo: string;
  items: NavItem[];
}

/**
 * Mapa del sistema — ver ESPECIFICACION.md §5.
 */
export const navGroups: NavGroup[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/", label: "Inicio", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/autos", label: "Gestión de autos", icon: Car },
      { href: "/leads", label: "Leads / Presupuestos", icon: UserSearch },
    ],
  },
  {
    titulo: "Marcas",
    items: [
      { href: "/finanzas", label: "Finanzas", icon: Wallet },
      { href: "/shop", label: "Shop", icon: ShoppingBag },
      { href: "/classmotor", label: "Classmotor", icon: Gauge },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/servicios", label: "Servicios", icon: Wrench },
      { href: "/recordatorios", label: "Recordatorios", icon: BellRing },
      { href: "/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
];

export const configItem: NavItem = {
  href: "/config",
  label: "Config",
  icon: Settings,
};
