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

export function mensajeMantenimiento(cliente: string, servicio: string): string {
  return `Hola ${cliente}, se acerca el mantenimiento de tu ${servicio}. Cuando quieras coordinamos un turno para dejarlo impecable. — JMF Detailing`;
}

export function mensajeRenovacion(cliente: string, servicio: string, auto: string): string {
  return `Hola ${cliente}, ya se cumple el ciclo de tu ${servicio}. Si querés, coordinamos para renovarlo y mantener tu ${auto} como el primer día. — JMF Detailing`;
}
