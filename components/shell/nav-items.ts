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
      { href: "/leads", label: "Leads / Presupuestos", icon: UserSearch },
      { href: "/finanzas", label: "Finanzas", icon: Wallet },
    ],
  },
  {
    titulo: "Marcas",
    items: [
      { href: "/autos", label: "Gestión Detailing", icon: Car },
      { href: "/shop", label: "Gestión de Shop", icon: ShoppingBag },
      { href: "/classmotor", label: "Gestión Classmotor", icon: Gauge },
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
