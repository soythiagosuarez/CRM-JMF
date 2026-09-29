/**
 * Datos de vehículo para la agenda online: tamaños que usa JMF para
 * cobrar (respuesta 3.7), sugerencia de tamaño por modelo y patente.
 */
import type { CondicionVehiculo, TamanoVehiculo } from "@/lib/types/reserva";

export const TAMANOS: { id: TamanoVehiculo; label: string; ejemplos: string }[] = [
  { id: "chico", label: "Chico", ejemplos: "Gol, Clio, 208" },
  { id: "mediano", label: "Mediano", ejemplos: "Corolla, Cruze" },
  { id: "suv", label: "SUV", ejemplos: "Tiguan, Compass" },
  { id: "pickup", label: "Pick-up", ejemplos: "Hilux, Amarok" },
  { id: "grande", label: "Grande", ejemplos: "Sprinter, F-150" },
];

export const TAMANO_LABEL: Record<TamanoVehiculo, string> = {
  chico: "Chico",
  mediano: "Mediano",
  suv: "SUV",
  pickup: "Pick-up",
  grande: "Grande",
};

export const CONDICION_LABEL: Record<CondicionVehiculo, string> = {
  "0km": "0 km",
  usado: "Usado",
};

/** Modelos comunes → tamaño. Es solo una sugerencia: el cliente la cambia. */
const MODELOS_POR_TAMANO: Record<TamanoVehiculo, string[]> = {
  chico: [
    "gol", "clio", "208", "207", "206", "up", "ka", "fiesta", "onix", "etios", "sandero",
    "mobi", "argo", "polo", "palio", "uno", "march", "108", "c3", "kwid", "celta",
  ],
  mediano: [
    "corolla", "cruze", "vento", "focus", "cronos", "virtus", "civic", "408", "fluence",
    "sentra", "logan", "prisma", "mondeo", "jetta", "a3", "serie 3", "c4", "golf",
  ],
  suv: [
    "tiguan", "compass", "ecosport", "t-cross", "tcross", "taos", "tracker", "kicks", "2008",
    "3008", "5008", "renegade", "territory", "duster", "hr-v", "hrv", "rav4", "sw4",
    "corolla cross", "nivus", "captur", "kuga", "q3", "q5", "x1", "x3", "pulse", "creta",
  ],
  pickup: [
    "hilux", "amarok", "ranger", "s10", "s-10", "frontier", "toro", "maverick", "alaskan",
    "saveiro", "strada", "montana", "oroch", "l200", "titano",
  ],
  grande: ["sprinter", "f150", "f-150", "ram", "master", "ducato", "h1", "transit", "boxer"],
};

export function sugerirTamano(modelo: string): TamanoVehiculo | null {
  const m = modelo.trim().toLowerCase();
  if (!m) return null;
  // Primero los nombres de varias palabras ("corolla cross" antes que "corolla").
  const candidatos = (Object.entries(MODELOS_POR_TAMANO) as [TamanoVehiculo, string[]][])
    .flatMap(([tamano, modelos]) => modelos.map((nombre) => ({ tamano, nombre })))
    .sort((a, b) => b.nombre.length - a.nombre.length);
  const conEspacios = ` ${m.replace(/[^a-z0-9-]+/g, " ")} `;
  for (const { tamano, nombre } of candidatos) {
    if (conEspacios.includes(` ${nombre} `)) return tamano;
  }
  return null;
}

/** "ab 123 cd" → "AB123CD" */
export function normalizarPatente(patente: string): string {
  return patente.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Muestra solo el comienzo de la patente: "AB 1•• ••" / "ABC •••". Para
 * que alguien que conoce el celular de otra persona no vea la patente
 * completa de sus autos (respuesta 3.2). */
export function enmascararPatente(patente: string | null): string {
  if (!patente) return "";
  const p = normalizarPatente(patente);
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(p)) return `${p.slice(0, 2)} ${p[2]}•• ••`;
  if (/^[A-Z]{3}\d{3}$/.test(p)) return `${p.slice(0, 3)} •••`;
  if (p.length <= 2) return "••";
  return p.slice(0, 2) + "•".repeat(p.length - 2);
}

/** Últimos 10 dígitos: igual que clientes.telefono_norm en la base. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, "").slice(-10);
}
