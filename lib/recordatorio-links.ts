/**
 * Envío semi-automático de recordatorios (§ feedback): sin API ni cron —
 * arma el link con el texto listo por el medio elegido, la persona lo
 * clickea y decide a quién mandárselo (o se lo manda a sí misma).
 */
import { linkWhatsappSinDestino } from "@/lib/whatsapp";
import type { MedioRecordatorio } from "@/lib/types/recordatorio";

export function linkSms(mensaje: string): string {
  return `sms:?&body=${encodeURIComponent(mensaje)}`;
}

export function linkGmail(asunto: string, cuerpo: string): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", su: asunto, body: cuerpo });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function linkRecordatorio(medio: MedioRecordatorio, titulo: string): string {
  const mensaje = `Recordatorio JMF: ${titulo}`;
  if (medio === "whatsapp") return linkWhatsappSinDestino(mensaje);
  if (medio === "sms") return linkSms(mensaje);
  return linkGmail("Recordatorio JMF", mensaje);
}
