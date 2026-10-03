/**
 * Lectura segura de las variantes de un servicio (vienen de un jsonb).
 * Sin "server-only": lo usan tanto el CRM como la agenda pública.
 */
import type { VarianteServicio } from "@/lib/types/servicio";

export function normalizarVariantes(raw: unknown): VarianteServicio[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && typeof v === "object" && typeof v.nombre === "string" && typeof v.precio === "number")
    .map((v) => ({
      nombre: v.nombre,
      precio: v.precio,
      precio_hasta: typeof v.precio_hasta === "number" ? v.precio_hasta : null,
      unidad: typeof v.unidad === "string" && v.unidad ? v.unidad : null,
      duracion_valor: typeof v.duracion_valor === "number" ? v.duracion_valor : null,
      duracion_unidad: v.duracion_unidad === "horas" || v.duracion_unidad === "dias" ? v.duracion_unidad : null,
    }));
}
