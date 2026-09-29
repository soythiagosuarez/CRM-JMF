import type {
  CanalReserva,
  CondicionVehiculo,
  ItemReserva,
  ReservaInput,
  ServicioPublico,
  TamanoVehiculo,
  VehiculoEnmascarado,
} from "@/lib/types/reserva";
import type { ResultadoDia } from "@/lib/reservas/disponibilidad";
import { normalizarPatente, normalizarTelefono } from "@/lib/reservas/vehiculos";

export interface VehiculoForm {
  marca: string;
  modelo: string;
  anio: string;
  patente: string;
  color: string;
  tamano: TamanoVehiculo | "";
  condicion: CondicionVehiculo | "";
}

export interface EstadoReserva {
  modo: "nuevo" | "actual" | null;
  telefono: string;
  nombre: string;
  email: string;
  busqueda: {
    estado: "idle" | "buscando" | "encontrado" | "no_encontrado";
    vehiculos: VehiculoEnmascarado[];
    error: string | null;
  };
  /** id de un auto ya cargado; null = carga un auto nuevo */
  vehiculoId: string | null;
  vehiculo: VehiculoForm;
  items: ItemReserva[];
  fecha: string | null;
  franja: string | null;
  puertaAPuerta: boolean;
  canal: CanalReserva | "";
  aceptaPromos: boolean;
}

export const ESTADO_INICIAL: EstadoReserva = {
  modo: null,
  telefono: "",
  nombre: "",
  email: "",
  busqueda: { estado: "idle", vehiculos: [], error: null },
  vehiculoId: null,
  vehiculo: { marca: "", modelo: "", anio: "", patente: "", color: "", tamano: "", condicion: "" },
  items: [],
  fecha: null,
  franja: null,
  puertaAPuerta: false,
  canal: "",
  aceptaPromos: false,
};

export const PASOS = [
  { id: "cliente", label: "Vos" },
  { id: "auto", label: "Tu auto" },
  { id: "servicios", label: "Servicios" },
  { id: "fecha", label: "Día y hora" },
  { id: "confirmar", label: "Confirmar" },
] as const;

export type IdPaso = (typeof PASOS)[number]["id"];

export const telefonoValido = (t: string) => normalizarTelefono(t).length === 10;

/** Devuelve qué falta para pasar al siguiente paso (o null si está completo). */
export function validarPaso(
  paso: IdPaso,
  e: EstadoReserva,
  servicios: ServicioPublico[],
  disponibilidad: Map<string, ResultadoDia> | null
): string | null {
  if (paso === "cliente") {
    if (!e.modo) return "Contanos si ya viniste a JMF o si es tu primera vez.";
    if (!telefonoValido(e.telefono)) {
      return "Revisá el celular: código de área sin el 0 y número sin el 15 (ej. 11 6972 8834).";
    }
    if (e.modo === "actual" && e.busqueda.estado !== "encontrado") return "Buscá tus datos con tu celular.";
    if (e.modo === "nuevo" && e.nombre.trim().length < 3) return "Completá tu nombre y apellido.";
    if (e.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email.trim())) return "Revisá el email.";
    return null;
  }

  if (paso === "auto") {
    if (e.vehiculoId) return null;
    const v = e.vehiculo;
    if (!v.marca.trim() || !v.modelo.trim()) return "Completá marca y modelo.";
    const anio = Number(v.anio);
    if (!Number.isInteger(anio) || anio < 1950 || anio > new Date().getFullYear() + 1) return "Revisá el año.";
    const patente = normalizarPatente(v.patente);
    if (patente.length < 5 || patente.length > 8) return "Revisá la patente.";
    if (!v.color.trim()) return "Completá el color.";
    if (!v.tamano) return "Elegí el tamaño del auto.";
    if (!v.condicion) return "Contanos si es 0 km o usado.";
    return null;
  }

  if (paso === "servicios") {
    if (e.items.length === 0) return "Elegí al menos un servicio.";
    for (const item of e.items) {
      const s = servicios.find((x) => x.id === item.servicio_id);
      if (s && s.variantes.length > 0 && item.variante == null) return `Elegí una opción de ${s.nombre}.`;
    }
    return null;
  }

  if (paso === "fecha") {
    if (!e.fecha) return "Elegí el día en que dejás el auto.";
    const dia = disponibilidad?.get(e.fecha);
    if (!dia?.disponible) return "Ese día ya no está disponible. Elegí otro.";
    if (!e.franja || !dia.franjas.some((f) => f.desde === e.franja)) return "Elegí la franja horaria.";
    return null;
  }

  if (!e.canal) return "Contanos cómo nos conociste.";
  return null;
}

export function armarInput(e: EstadoReserva): ReservaInput {
  const v = e.vehiculo;
  return {
    modo: e.modo === "actual" ? "actual" : "nuevo",
    telefono: e.telefono,
    nombre: e.nombre,
    email: e.email,
    vehiculo_id: e.vehiculoId,
    vehiculo: e.vehiculoId
      ? null
      : {
          marca: v.marca,
          modelo: v.modelo,
          anio: Number(v.anio),
          patente: v.patente,
          color: v.color,
          tamano: v.tamano as TamanoVehiculo,
          condicion: v.condicion as CondicionVehiculo,
        },
    items: e.items,
    fecha: e.fecha ?? "",
    franja_desde: e.franja ?? "",
    puerta_a_puerta: e.puertaAPuerta,
    canal: e.canal as CanalReserva,
    acepta_promos: e.aceptaPromos,
  };
}
