/**
 * WhatsApp semi-automático, sin API ni costo (ver ESPECIFICACION.md §3 y §7 regla 8).
 * Arma el link con el mensaje pre-cargado; el envío lo hace la persona.
 */
export function linkWhatsapp(telefono: string, mensaje: string): string {
  const numero = telefono.replace(/[^\d]/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function mensajeCambioFase(cliente: string, auto: string, fase: string): string {
  return `Hola ${cliente}, te contamos que tu ${auto} ya pasó a la etapa de ${fase}. Cualquier cosa quedamos a disposición. — JMF Detailing`;
}

export function mensajeListoRetira(cliente: string, auto: string): string {
  return `Hola ${cliente}, tu ${auto} ya está terminado y listo para retirar. Coordinamos cuando quieras pasar. — JMF Detailing`;
}

export function mensajeListoPuertaAPuerta(cliente: string, auto: string): string {
  return `Hola ${cliente}, tu ${auto} ya está terminado. Coordinamos el día y horario para llevártelo. — JMF Detailing`;
}

export function mensajeMantenimiento(cliente: string, servicio: string): string {
  return `Hola ${cliente}, se acerca el mantenimiento de tu ${servicio}. Cuando quieras coordinamos un turno para dejarlo impecable. — JMF Detailing`;
}

export function mensajeRenovacion(cliente: string, servicio: string, auto: string): string {
  return `Hola ${cliente}, ya se cumple el ciclo de tu ${servicio}. Si querés, coordinamos para renovarlo y mantener tu ${auto} como el primer día. — JMF Detailing`;
}

/**
 * Presupuesto formateado para WhatsApp (negrita con *asteriscos*, emojis,
 * y una tabla en bloque monoespaciado con tres backticks). A diferencia
 * de las plantillas de aviso, acá el precio va incluido a propósito:
 * es justamente lo que se está mandando.
 */
export function mensajePresupuesto(datos: {
  nombreContacto: string;
  vehiculo: string;
  queObservo: string | null;
  servicios: { nombre: string; precio: number }[];
  tiempoEstimado: string | null;
  validez: string | null;
  formatARS: (n: number) => string;
  formatFecha: (f: string) => string;
}): string {
  const { nombreContacto, vehiculo, queObservo, servicios, tiempoEstimado, validez, formatARS, formatFecha } =
    datos;

  const total = servicios.reduce((acc, s) => acc + s.precio, 0);
  const anchoNombre = Math.max(...servicios.map((s) => s.nombre.length), 10);
  const tabla = servicios
    .map((s) => `${s.nombre.padEnd(anchoNombre, " ")}  ${formatARS(s.precio)}`)
    .join("\n");

  const lineas = [
    `🚗 *Presupuesto — JMF Detailing*`,
    ``,
    `Hola ${nombreContacto}! Te dejamos el presupuesto para tu ${vehiculo}.`,
    queObservo ? `📝 Observado: ${queObservo}` : null,
    ``,
    `📋 *Servicios*`,
    "```",
    tabla,
    "```",
    `💰 *Total: ${formatARS(total)}*`,
    tiempoEstimado ? `⏱️ Tiempo estimado: ${tiempoEstimado}` : null,
    validez ? `✅ Válido hasta ${formatFecha(validez)}` : null,
    ``,
    `Cualquier consulta quedamos a disposición 🙌`,
    `— JMF Detailing`,
  ].filter((l): l is string => l !== null);

  return lineas.join("\n");
}
