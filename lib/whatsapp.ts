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
 * Presupuesto formateado para WhatsApp para que se lea como un documento,
 * no como un mensaje suelto: separadores en bloque, encabezado tipo
 * membrete, campos etiquetados y la tabla en monoespaciado. Sin emojis a
 * propósito: en las pruebas mostraban "�" en WhatsApp Web con la sesión
 * recién abierta (assets de emoji sin cargar todavía) — se puede volver
 * a agregar si se confirma que en un teléfono real anda bien.
 * A diferencia de las plantillas de aviso, acá el precio va incluido
 * a propósito: es justamente lo que se está mandando. No se adjunta PDF
 * porque WhatsApp no permite adjuntar archivos desde un link (ver §3).
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

  const raya = "━━━━━━━━━━━━━━━━━━━━━━━━";

  const lineas = [
    raya,
    `      *JMF DETAILING*`,
    `   Presupuesto de servicio`,
    raya,
    ``,
    `*Cliente:* ${nombreContacto}`,
    `*Vehículo:* ${vehiculo}`,
    queObservo ? `*Observado:* ${queObservo}` : null,
    ``,
    `*DETALLE DEL SERVICIO*`,
    "```",
    tabla,
    "```",
    `*TOTAL: ${formatARS(total)}*`,
    ``,
    tiempoEstimado ? `*Tiempo estimado:* ${tiempoEstimado}` : null,
    validez ? `*Válido hasta:* ${formatFecha(validez)}` : null,
    raya,
    `Gracias por confiar en nosotros.`,
    `Cualquier consulta, quedamos a disposición.`,
  ].filter((l): l is string => l !== null);

  return lineas.join("\n");
}
