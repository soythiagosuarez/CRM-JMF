/**
 * Fidelización (propuesta 2): los puntos y premios viven en Clientes y
 * los maneja JMF; al cliente se le avisa por WhatsApp.
 */
export interface Premio {
  id: string;
  nombre: string;
  puntos: number;
  condiciones: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type TipoMovimientoPuntos = "servicio" | "reserva_online" | "manual" | "canje";

export interface MovimientoPuntos {
  id: string;
  cliente_id: string;
  /** positivo = suma, negativo = resta (canjes y ajustes) */
  puntos: number;
  tipo: TipoMovimientoPuntos;
  motivo: string | null;
  orden_id: string | null;
  premio_id: string | null;
  premio_nombre: string | null;
  canje_estado: "pendiente" | "usado" | null;
  canje_usado_en: string | null;
  created_at: string;
}

export type RespuestaAviso = "acepta" | "guarda" | "no_interesa";

export const RESPUESTA_AVISO_LABEL: Record<RespuestaAviso, string> = {
  acepta: "Aceptó y canjeó",
  guarda: "Lo guarda para más adelante",
  no_interesa: "No le interesa",
};

export interface AvisoFidelizacion {
  id: string;
  cliente_id: string;
  saldo_al_avisar: number;
  respuesta: RespuestaAviso | null;
  saldo_post: number | null;
  respondido_en: string | null;
  created_at: string;
}

/**
 * sin_premio: no le alcanza para ningún premio.
 * avisar: llegó a un premio y todavía no se le avisó (o alcanzó uno nuevo).
 * reavisar: se le avisó y no respondió en X días (respuesta 12.4).
 * esperando: se le avisó hace poco y no respondió todavía.
 * al_dia: ya respondió y no alcanzó ningún premio nuevo desde entonces.
 */
export type EstadoAviso = "sin_premio" | "avisar" | "reavisar" | "esperando" | "al_dia";

export interface ResumenFidelizacion {
  saldo: number;
  total_gastado: number;
  premios_disponibles: Premio[];
  ultimo_aviso: AvisoFidelizacion | null;
  estado_aviso: EstadoAviso;
}

/** Cliente al que hay que avisarle que tiene premio (alerta en Inicio). */
export interface AlertaPremio {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  saldo: number;
  premios: string[];
  reaviso: boolean;
}
