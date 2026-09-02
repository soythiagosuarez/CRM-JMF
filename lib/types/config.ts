/**
 * Configuración editable del negocio — antes hardcodeada, ahora vive en
 * la tabla "configuracion" (fila única "global").
 */
import type { MarcaMovimiento, TipoMovimiento } from "./movimiento";

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export const DIAS_SEMANA: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DIA_LABEL: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

export interface HorarioDia {
  cerrado: boolean;
  desde: string; // "HH:MM"
  hasta: string; // "HH:MM"
}

export type Horarios = Record<DiaSemana, HorarioDia>;

export type CategoriasMovimiento = Record<TipoMovimiento, Record<MarcaMovimiento, string[]>>;

export interface Configuracion {
  id: string;
  horarios: Horarios;
  categorias_movimiento: CategoriasMovimiento;
  updated_at: string;
}

/** getDay() de JS: 0=domingo ... 6=sábado. */
export const DIA_SEMANA_POR_INDICE: DiaSemana[] = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const DIA_CORTO: Record<DiaSemana, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

/** Resumen legible de los horarios, agrupando días consecutivos con el
 * mismo rango: "Lun a vie 09:00–18:00 · Sáb 10:00–13:00". */
export function resumenHorarios(horarios: Horarios): string {
  const grupos: { desde: string; primero: DiaSemana; ultimo: DiaSemana; hasta: string }[] = [];

  for (const dia of DIAS_SEMANA) {
    const h = horarios[dia];
    if (h.cerrado) continue;
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.desde === h.desde && ultimo.hasta === h.hasta) {
      ultimo.ultimo = dia;
    } else {
      grupos.push({ desde: h.desde, hasta: h.hasta, primero: dia, ultimo: dia });
    }
  }

  if (grupos.length === 0) return "Cerrado todos los días";

  return grupos
    .map((g) => {
      const rango =
        g.primero === g.ultimo
          ? DIA_CORTO[g.primero]
          : `${DIA_CORTO[g.primero]} a ${DIA_CORTO[g.ultimo].toLowerCase()}`;
      return `${rango} ${g.desde}–${g.hasta}`;
    })
    .join(" · ");
}
