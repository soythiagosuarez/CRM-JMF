/**
 * Formato de plata del sistema: pesos con separador de miles (ver §11 de la spec).
 * Ej.: formatARS(3850000) -> "$3.850.000"
 */
export function formatARS(monto: number): string {
  const signo = monto < 0 ? "-" : "";
  const entero = Math.round(Math.abs(monto));
  return `${signo}$${entero.toLocaleString("es-AR")}`;
}

export function formatFecha(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
