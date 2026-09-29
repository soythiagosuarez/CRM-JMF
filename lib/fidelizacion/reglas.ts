/**
 * Reglas de puntos y avisos (respuestas 9.x y 12.x de Joaco). Funciones
 * puras: las usan las pantallas y las acciones del servidor.
 */
import type { AvisoFidelizacion, EstadoAviso, Premio } from "@/lib/types/fidelizacion";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** 1 punto cada $5.000 (configurable) sobre lo cobrado en servicios básicos. */
export function puntosPorMonto(montoArs: number, pesosPorPunto: number): number {
  if (!Number.isFinite(montoArs) || montoArs <= 0 || pesosPorPunto <= 0) return 0;
  return Math.floor(montoArs / pesosPorPunto);
}

export interface ServicioOrdenParaPuntos {
  basico: boolean;
  precio: number | null;
}

/**
 * Parte de lo cobrado que corresponde a servicios básicos (PPF, cerámico
 * y acrílico no suman). Si la orden tiene precios por servicio, se
 * prorratea; si no, decide el servicio principal.
 */
export function montoBasico(
  montoCobradoArs: number,
  precioTotal: number | null,
  principal: ServicioOrdenParaPuntos,
  adicionales: ServicioOrdenParaPuntos[]
): number {
  const sumaAdicionales = adicionales.reduce((acc, a) => acc + (a.precio ?? 0), 0);
  if (precioTotal && precioTotal > 0 && sumaAdicionales > 0) {
    const precioPrincipal = Math.max(0, precioTotal - sumaAdicionales);
    const basico =
      (principal.basico ? precioPrincipal : 0) +
      adicionales.filter((a) => a.basico).reduce((acc, a) => acc + (a.precio ?? 0), 0);
    return montoCobradoArs * Math.min(1, basico / precioTotal);
  }
  return principal.basico ? montoCobradoArs : 0;
}

export function premiosActivos(premios: Premio[]): Premio[] {
  return premios.filter((p) => p.activo).sort((a, b) => a.puntos - b.puntos);
}

export function premiosAlcanzables(saldo: number, premios: Premio[]): Premio[] {
  return premiosActivos(premios).filter((p) => p.puntos <= saldo);
}

export function estadoAviso(
  saldo: number,
  premios: Premio[],
  ultimo: AvisoFidelizacion | null,
  reavisoDias: number,
  ahora: Date = new Date()
): EstadoAviso {
  const alcanzables = premiosAlcanzables(saldo, premios);
  if (alcanzables.length === 0) return "sin_premio";
  if (!ultimo) return "avisar";

  if (!ultimo.respuesta) {
    const dias = (ahora.getTime() - new Date(ultimo.created_at).getTime()) / MS_POR_DIA;
    return dias >= reavisoDias ? "reavisar" : "esperando";
  }

  // Ya respondió: se vuelve a avisar cuando llega a un premio que no
  // tenía al momento de responder (si canjeó, se cuenta desde el saldo
  // que le quedó).
  const base = ultimo.saldo_post ?? ultimo.saldo_al_avisar;
  return alcanzables.some((p) => p.puntos > base) ? "avisar" : "al_dia";
}

export function debeAlertar(estado: EstadoAviso): boolean {
  return estado === "avisar" || estado === "reavisar";
}
