/**
 * Celulares de la agenda online. En zona norte hay muchos clientes de
 * otras provincias y de otros países, así que se elige el país y se
 * escribe el número como lo usa la persona.
 *
 * - Argentina: código de área (cualquiera: 11, 351, 2304…) + número,
 *   10 dígitos en total, sin el 0 ni el 15.
 * - Otros países: "+código número", entre 8 y 15 dígitos en total.
 *
 * El cliente se reconoce por los últimos 10 dígitos (telefono_norm,
 * igual que el trigger de la base).
 */

export interface PaisTelefono {
  /** Código de país sin el "+"; vacío = otro país (se escribe con +). */
  codigo: string;
  nombre: string;
  ejemplo: string;
}

export const PAIS_ARGENTINA = "54";
export const PAIS_OTRO = "";

export const PAISES_TELEFONO: PaisTelefono[] = [
  { codigo: "54", nombre: "Argentina", ejemplo: "11 2345 6789" },
  { codigo: "598", nombre: "Uruguay", ejemplo: "94 123 456" },
  { codigo: "595", nombre: "Paraguay", ejemplo: "981 123 456" },
  { codigo: "591", nombre: "Bolivia", ejemplo: "71 234 567" },
  { codigo: "56", nombre: "Chile", ejemplo: "9 1234 5678" },
  { codigo: "51", nombre: "Perú", ejemplo: "912 345 678" },
  { codigo: "55", nombre: "Brasil", ejemplo: "11 91234 5678" },
  { codigo: "58", nombre: "Venezuela", ejemplo: "412 123 4567" },
  { codigo: "57", nombre: "Colombia", ejemplo: "301 234 5678" },
  { codigo: "593", nombre: "Ecuador", ejemplo: "99 123 4567" },
  { codigo: "52", nombre: "México", ejemplo: "55 1234 5678" },
  { codigo: "34", nombre: "España", ejemplo: "612 34 56 78" },
  { codigo: "1", nombre: "Estados Unidos", ejemplo: "201 555 0123" },
  { codigo: "", nombre: "Otro país", ejemplo: "+39 312 345 6789" },
];

/** Lo que se guarda: el número para mostrar/WhatsApp y la clave para buscar. */
export interface TelefonoValido {
  telefono: string;
  norm: string;
}

const soloDigitos = (s: string) => s.replace(/\D/g, "");

/** Número argentino sin código de país: 10 dígitos (área + número). */
function nacionalArgentino(digitos: string): string | null {
  let d = digitos.replace(/^0+/, "");
  if (d.length === 11 && d.startsWith("9")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

/**
 * Interpreta lo que escribió la persona. Con "+" adelante es un número
 * internacional completo; sin "+", es argentino.
 */
export function interpretarTelefono(texto: string): TelefonoValido | null {
  const t = String(texto ?? "").trim().slice(0, 40);
  const digitos = soloDigitos(t);
  if (t.startsWith("+")) {
    if (digitos.startsWith(PAIS_ARGENTINA)) {
      const nacional = nacionalArgentino(digitos.slice(2));
      return nacional ? { telefono: t, norm: nacional } : null;
    }
    if (digitos.length < 8 || digitos.length > 15) return null;
    return { telefono: t, norm: digitos.slice(-10) };
  }
  const nacional = nacionalArgentino(digitos);
  return nacional ? { telefono: t, norm: nacional } : null;
}

/** Arma el texto completo a partir del país elegido y el número. */
export function telefonoCompleto(pais: string, numero: string): string {
  const n = numero.trim();
  if (pais === PAIS_ARGENTINA || n.startsWith("+")) return n;
  if (pais === PAIS_OTRO) return n ? `+${n.replace(/^\+/, "")}` : "";
  return n ? `+${pais} ${n}` : "";
}
