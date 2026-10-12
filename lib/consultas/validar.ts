/**
 * Validación de lo que llega desde el formulario de la web. Es un
 * endpoint público: no se confía en nada de lo que mande el navegador.
 */
import { interpretarTelefono } from "@/lib/reservas/telefono";
import type { ConsultaWebInput } from "@/lib/types/consulta";

const texto = (valor: unknown, max: number): string => String(valor ?? "").trim().slice(0, max);
const opcional = (valor: unknown, max: number): string | null => texto(valor, max) || null;

/**
 * Campo trampa: está oculto en la web, una persona nunca lo completa.
 * Si viene con algo, es un bot.
 */
export const CAMPO_TRAMPA = "empresa";

export type ResultadoValidacion =
  | { ok: true; consulta: ConsultaWebInput }
  | { ok: false; error: string }
  | { ok: false; bot: true };

export function validarConsultaWeb(crudo: unknown): ResultadoValidacion {
  if (!crudo || typeof crudo !== "object") return { ok: false, error: "No llegaron los datos de la consulta." };
  const d = crudo as Record<string, unknown>;
  if (texto(d[CAMPO_TRAMPA], 200)) return { ok: false, bot: true };

  // Acepta los nombres del formulario de la web (inglés) y los del CRM.
  const nombre = texto(d.nombre ?? d.name, 120);
  if (nombre.length < 2) return { ok: false, error: "Completá tu nombre." };

  const telefono = interpretarTelefono(texto(d.telefono ?? d.phone, 40));
  if (!telefono) {
    return {
      ok: false,
      error: "Revisá el WhatsApp: código de área sin el 0 y número sin el 15 (si es de otro país, con + y el código).",
    };
  }

  const email = opcional(d.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Revisá el email." };

  return {
    ok: true,
    consulta: {
      nombre,
      telefono: telefono.telefono,
      telefono_norm: telefono.norm,
      email,
      vehiculo: opcional(d.vehiculo ?? d.vehicle, 120),
      servicio: opcional(d.servicio ?? d.service, 80),
      mensaje: opcional(d.mensaje ?? d.message, 2000),
    },
  };
}
