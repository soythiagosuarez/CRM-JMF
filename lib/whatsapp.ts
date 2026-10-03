/**
 * WhatsApp semi-automático, sin API ni costo (ver ESPECIFICACION.md §3 y §7 regla 8).
 * Arma el link con el mensaje pre-cargado; el envío lo hace la persona.
 */
export function linkWhatsapp(telefono: string, mensaje: string): string {
  return `https://wa.me/${numeroWhatsapp(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * wa.me necesita el número internacional (54 9 + área + número). Los
 * celulares se cargan como los escribe la gente ("11 5555-1234",
 * "011 5555 1234", "+54 9 11 ..."), así que se completan los números
 * argentinos que vienen sin código de país o sin el 9 de celular.
 */
export function numeroWhatsapp(telefono: string): string {
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) return "549" + d;
  if (d.length === 12 && d.startsWith("54") && d[2] !== "9") return "549" + d.slice(2);
  return d;
}

/** Variante sin destinatario fijo (ej. recordatorios libres, sin un
 * cliente asociado): abre WhatsApp con el mensaje listo y el usuario
 * elige a quién mandárselo. */
export function linkWhatsappSinDestino(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
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

/**
 * Mensaje que el cliente le manda a JMF al terminar de reservar en la
 * agenda online (aprobado por Joaco, respuesta 6.3). Como el ingreso es
 * por franja, el horario va como rango ("entre las 9:00 y las 13:00").
 */
export function mensajeReservaAJmf(datos: {
  cliente: string;
  auto: string;
  patente: string;
  servicio: string;
  dia: string;
  franja: string;
  precio: string;
  codigo: string;
  aConfirmar: boolean;
  puertaAPuerta: boolean;
}): string {
  const lineas = [
    "Hola JMF Detailing! Acabo de reservar un turno:",
    `Nombre: ${datos.cliente}`,
    `Auto: ${datos.auto}${datos.patente ? ` (${datos.patente})` : ""}`,
    `Servicio: ${datos.servicio}`,
    `Día: ${datos.dia}, ${datos.franja}`,
    `Precio aproximado: ${datos.precio}`,
    `Código de reserva: ${datos.codigo}`,
    datos.puertaAPuerta ? "Quiero el servicio puerta a puerta." : null,
    datos.aConfirmar ? "Quedo a la espera de que me confirmen el turno." : null,
  ].filter((l): l is string => l !== null);
  return lineas.join("\n");
}

/** Recordatorio del turno, para mandar el día anterior (respuesta 6.7). */
export function mensajeRecordarTurno(
  cliente: string,
  auto: string,
  dia: string,
  franja: string,
  direccion: string
): string {
  return `Hola ${cliente}, te recordamos tu turno en JMF Detailing para tu ${auto} el ${dia}, ${franja}. Te esperamos en ${direccion}. El timbre no funciona: avisanos por acá cuando llegues. — JMF Detailing`;
}

/** Aviso de puntos para canjear (aprobado por Joaco, respuesta 12.2). */
export function mensajePremiosDisponibles(cliente: string, puntos: number, premios: string[]): string {
  return `Hola ${cliente}, gracias por confiar en JMF Detailing. Ya juntaste ${puntos} puntos y podés canjearlos por: ${premios.join(", ")}. Si querés, lo usamos en tu próximo turno. — JMF Detailing`;
}
