import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerContextoAgenda } from "./datos";
import type { EstadoAgendaOnline } from "@/lib/types/reserva";

/**
 * Hace lo mismo que la página pública (/reservar) para decir en Config si
 * la agenda está funcionando y, si no, por qué. La página pública muestra
 * un aviso genérico a los clientes; acá se ve el detalle.
 */
export async function diagnosticarAgendaOnline(): Promise<EstadoAgendaOnline> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      problema:
        "Falta la variable SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings → Environment Variables, marcada para Production y Preview). Después de cargarla hay que volver a publicar (Redeploy).",
    };
  }
  try {
    const ctx = await obtenerContextoAgenda(createAdminClient());
    if (ctx.reservables.length === 0) {
      return {
        ok: false,
        problema:
          "Ningún servicio activo está marcado para reservar online. Editalo en Servicios (¿Se reserva online?).",
      };
    }
    return { ok: true, servicios: ctx.reservables.length };
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    const claveInvalida = /invalid api key|jwt|unauthorized|401/i.test(detalle);
    return {
      ok: false,
      problema: claveInvalida
        ? `La clave SUPABASE_SERVICE_ROLE_KEY no es válida para este proyecto (${detalle}). Copiá la service_role (o la secret key) del mismo proyecto de Supabase.`
        : `La agenda no puede leer la base de datos: ${detalle}. ¿Se corrió la migración 0009 en Supabase?`,
    };
  }
}
