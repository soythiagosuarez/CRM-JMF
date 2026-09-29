/**
 * Fechas de la agenda online. Todo en strings ISO (YYYY-MM-DD) y cuentas
 * en UTC, para que el resultado sea el mismo en el navegador del cliente
 * y en el servidor de Vercel (que corre en UTC, no en hora argentina).
 */
import { DIA_SEMANA_POR_INDICE, type DiaSemana } from "@/lib/types/config";

const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Argentina, sin importar el huso del servidor. */
export function hoyArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_ARGENTINA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

export function aFecha(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const d = aFecha(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return aISO(d);
}

export function diaDeSemana(iso: string): DiaSemana {
  return DIA_SEMANA_POR_INDICE[aFecha(iso).getUTCDay()];
}

/** Lunes de la semana (lunes a domingo) que contiene `iso`. */
export function lunesDeSemana(iso: string): string {
  const indice = (aFecha(iso).getUTCDay() + 6) % 7; // lunes = 0
  return sumarDias(iso, -indice);
}

export function esFechaISO(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(aFecha(valor).getTime());
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "lunes 6 de octubre" */
export function fechaLarga(iso: string): string {
  const d = aFecha(iso);
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}

export function nombreMes(iso: string): string {
  const d = aFecha(iso);
  return `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "09:00" → "9:00" (así se lee en los mensajes). */
export function horaCorta(hora: string): string {
  const [h, m] = hora.slice(0, 5).split(":");
  return `${Number(h)}:${m}`;
}

/** "entre las 9:00 y las 13:00" */
export function textoFranja(desde: string, hasta: string | null): string {
  return hasta
    ? `entre las ${horaCorta(desde)} y las ${horaCorta(hasta)}`
    : `a las ${horaCorta(desde)}`;
}

/** Hora actual en Argentina, "HH:MM". */
export function horaArgentina(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_ARGENTINA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ahora);
}
