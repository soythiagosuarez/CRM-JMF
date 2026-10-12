/**
 * Consultas que llegan desde el formulario de Contacto de la web de JMF
 * Detailing (jmfdetailing en GitHub Pages) y se gestionan en el CRM.
 */
export type EstadoConsulta = "nueva" | "en_contacto" | "concretada" | "descartada";

export const ESTADOS_CONSULTA: EstadoConsulta[] = ["nueva", "en_contacto", "concretada", "descartada"];

export const ESTADO_CONSULTA_LABEL: Record<EstadoConsulta, string> = {
  nueva: "Nueva",
  en_contacto: "En contacto",
  concretada: "Concretada",
  descartada: "Descartada",
};

export interface ConsultaWeb {
  id: string;
  nombre: string;
  telefono: string;
  telefono_norm: string | null;
  email: string | null;
  vehiculo: string | null;
  servicio: string | null;
  mensaje: string | null;
  estado: EstadoConsulta;
  notas: string | null;
  cliente_id: string | null;
  origen: string;
  created_at: string;
  updated_at: string;
}

/** Lo que manda la web, ya validado. */
export interface ConsultaWebInput {
  nombre: string;
  telefono: string;
  telefono_norm: string;
  email: string | null;
  vehiculo: string | null;
  servicio: string | null;
  mensaje: string | null;
}
