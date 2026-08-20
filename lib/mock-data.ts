/**
 * Datos de ejemplo para la pantalla "Inicio" mientras no hay módulos
 * conectados a Supabase todavía (ver ESPECIFICACION.md §9.1 y §11).
 * TODO: reemplazar por datos reales cuando se construyan Órdenes,
 * Finanzas, Servicios y Recordatorios.
 */

export const kpisMock = {
  autosEnTaller: 6,
  ingresosMes: 8_450_000,
  egresosMes: 3_120_000,
};

export const finanzasPorMarcaMock = [
  { marca: "Detailing", ingresos: 5_600_000, egresos: 1_800_000 },
  { marca: "Shop", ingresos: 1_250_000, egresos: 420_000 },
  { marca: "Classmotor", ingresos: 1_600_000, egresos: 300_000 },
  { marca: "Compartido", ingresos: 0, egresos: 600_000 },
] as const;

export const metaMesMock = {
  ppf: { actual: 1, objetivo: 3 },
  ceramicoSemana: { actual: 1, objetivo: 1 },
};

export type FlagOrden =
  | "esperando_repuesto_producto"
  | "esperando_cliente"
  | "demorado";

export const flagLabel: Record<FlagOrden, string> = {
  esperando_repuesto_producto: "Esperando repuesto/producto",
  esperando_cliente: "Esperando cliente",
  demorado: "Demorado",
};

export interface AutoTallerMock {
  id: string;
  cliente: string;
  telefono: string;
  auto: string;
  servicio: string;
  fase: string;
  flags: FlagOrden[];
}

export const autosEnTallerMock: AutoTallerMock[] = [
  {
    id: "1",
    cliente: "Martín Ibarra",
    telefono: "5491122334455",
    auto: "VW Golf GTI",
    servicio: "PPF",
    fase: "Pulido",
    flags: [],
  },
  {
    id: "2",
    cliente: "Rocío Fernández",
    telefono: "5491133445566",
    auto: "Toyota Corolla",
    servicio: "Tratamiento cerámico",
    fase: "Descontaminado",
    flags: ["esperando_repuesto_producto"],
  },
  {
    id: "3",
    cliente: "Nicolás Paredes",
    telefono: "5491144556677",
    auto: "Fiat Cronos",
    servicio: "Lavado premium",
    fase: "Lavado de llantas",
    flags: [],
  },
  {
    id: "4",
    cliente: "Julieta Sosa",
    telefono: "5491155667788",
    auto: "Ford Ranger",
    servicio: "Limpieza de interior full",
    fase: "Armado",
    flags: ["demorado"],
  },
  {
    id: "5",
    cliente: "Diego Herrera",
    telefono: "5491166778899",
    auto: "Chevrolet Onix",
    servicio: "Restauración de ópticas",
    fase: "Pulido",
    flags: ["esperando_cliente"],
  },
  {
    id: "6",
    cliente: "Camila Vidal",
    telefono: "5491177889900",
    auto: "Peugeot 208",
    servicio: "Polarizado",
    fase: "Colocación",
    flags: [],
  },
];

export const mixServiciosMock = [
  { servicio: "PPF", cantidad: 4 },
  { servicio: "Tratamiento cerámico", cantidad: 6 },
  { servicio: "Lavado premium", cantidad: 12 },
  { servicio: "Limpieza de interior full", cantidad: 5 },
  { servicio: "Restauración de ópticas", cantidad: 2 },
  { servicio: "Polarizado", cantidad: 3 },
];

export interface RecordatorioMock {
  id: string;
  cliente: string;
  telefono: string;
  auto: string;
  tratamiento: string;
  tipo: "mantenimiento" | "renovacion";
  fechaProxima: string;
}

export const recordatoriosMock: RecordatorioMock[] = [
  {
    id: "1",
    cliente: "Lucas Bianchi",
    telefono: "5491188990011",
    auto: "Audi A3",
    tratamiento: "Tratamiento cerámico",
    tipo: "mantenimiento",
    fechaProxima: "2026-08-25",
  },
  {
    id: "2",
    cliente: "Sofía Cabrera",
    telefono: "5491199001122",
    auto: "BMW Serie 1",
    tratamiento: "PPF",
    tipo: "mantenimiento",
    fechaProxima: "2026-08-28",
  },
  {
    id: "3",
    cliente: "Tomás Aguirre",
    telefono: "5491100112233",
    auto: "Renault Sandero",
    tratamiento: "Limpieza de interior full",
    tipo: "renovacion",
    fechaProxima: "2026-09-02",
  },
];
