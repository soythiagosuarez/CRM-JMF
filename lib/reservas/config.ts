/**
 * Valores por defecto de la agenda online y de la fidelización (los que
 * respondió Joaco). La base los trae cargados desde la migración 0009;
 * esto completa cualquier dato que falte para no romper la página.
 */
import {
  DIAS_SEMANA,
  type ConfigFidelizacion,
  type ConfigReservas,
  type Franja,
  type FranjasPorDia,
} from "@/lib/types/config";

const MANANA_Y_TARDE: Franja[] = [
  { desde: "09:00", hasta: "13:00" },
  { desde: "14:00", hasta: "18:00" },
];

export const CONFIG_RESERVAS_DEFAULT: ConfigReservas = {
  whatsapp: "5491169728834",
  direccion: "Ituzaingó 1343, San Fernando",
  indicaciones: [
    "Te recomendamos no dejar objetos personales dentro del auto: facilita la limpieza.",
    "El timbre del taller no funciona: avisanos por WhatsApp o aplaudí cuando llegues.",
  ],
  franjas: {
    lunes: MANANA_Y_TARDE,
    martes: MANANA_Y_TARDE,
    miercoles: MANANA_Y_TARDE,
    jueves: MANANA_Y_TARDE,
    viernes: MANANA_Y_TARDE,
    sabado: [{ desde: "09:00", hasta: "13:00" }],
    domingo: [],
  },
  capacidad_taller: 5,
  anticipacion_min_dias: 1,
  anticipacion_max_dias: 60,
  max_pendientes_por_celular: 2,
};

export const CONFIG_FIDELIZACION_DEFAULT: ConfigFidelizacion = {
  pesos_por_punto: 5000,
  reaviso_dias: 15,
  puntos_por_motivo: {},
};

function numero(valor: unknown, porDefecto: number): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : porDefecto;
}

function normalizarFranjas(raw: unknown): FranjasPorDia {
  const origen = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const franjas = {} as FranjasPorDia;
  for (const dia of DIAS_SEMANA) {
    const lista = Array.isArray(origen[dia]) ? (origen[dia] as unknown[]) : CONFIG_RESERVAS_DEFAULT.franjas[dia];
    franjas[dia] = lista
      .filter(
        (f): f is Franja =>
          !!f && typeof (f as Franja).desde === "string" && typeof (f as Franja).hasta === "string"
      )
      .map((f) => ({ desde: f.desde.slice(0, 5), hasta: f.hasta.slice(0, 5) }))
      .sort((a, b) => a.desde.localeCompare(b.desde));
  }
  return franjas;
}

export function normalizarConfigReservas(raw: unknown): ConfigReservas {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<ConfigReservas>;
  const d = CONFIG_RESERVAS_DEFAULT;
  return {
    whatsapp: typeof r.whatsapp === "string" && r.whatsapp ? r.whatsapp.replace(/\D/g, "") : d.whatsapp,
    direccion: typeof r.direccion === "string" && r.direccion ? r.direccion : d.direccion,
    indicaciones: Array.isArray(r.indicaciones)
      ? r.indicaciones.filter((i): i is string => typeof i === "string" && i.trim() !== "")
      : d.indicaciones,
    franjas: normalizarFranjas(r.franjas),
    capacidad_taller: Math.max(1, numero(r.capacidad_taller, d.capacidad_taller)),
    anticipacion_min_dias: Math.max(0, numero(r.anticipacion_min_dias, d.anticipacion_min_dias)),
    anticipacion_max_dias: Math.max(1, numero(r.anticipacion_max_dias, d.anticipacion_max_dias)),
    max_pendientes_por_celular: Math.max(1, numero(r.max_pendientes_por_celular, d.max_pendientes_por_celular)),
  };
}

export function normalizarConfigFidelizacion(raw: unknown): ConfigFidelizacion {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<ConfigFidelizacion>;
  const d = CONFIG_FIDELIZACION_DEFAULT;
  const puntos: ConfigFidelizacion["puntos_por_motivo"] = {};
  if (r.puntos_por_motivo && typeof r.puntos_por_motivo === "object") {
    for (const [motivo, valor] of Object.entries(r.puntos_por_motivo)) {
      if (typeof valor === "number" && Number.isFinite(valor) && valor !== 0) {
        puntos[motivo as keyof typeof puntos] = valor;
      }
    }
  }
  return {
    pesos_por_punto: Math.max(1, numero(r.pesos_por_punto, d.pesos_por_punto)),
    reaviso_dias: Math.max(1, numero(r.reaviso_dias, d.reaviso_dias)),
    puntos_por_motivo: puntos,
  };
}

/** "5491169728834" → "+54 9 11 6972-8834" (para mostrarlo). */
export function formatearWhatsapp(numero: string): string {
  const d = numero.replace(/\D/g, "");
  const m = d.match(/^54(9)?(\d{2})(\d{4})(\d{4})$/);
  if (!m) return `+${d}`;
  return `+54 ${m[1] ? "9 " : ""}${m[2]} ${m[3]}-${m[4]}`;
}
