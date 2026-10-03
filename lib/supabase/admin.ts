import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la service role key: saltea RLS. Se usa SOLO
 * desde el servidor para la agenda pública (/reservar), donde el cliente
 * que reserva no tiene login. Nunca importarlo desde un componente de
 * cliente ni devolver filas crudas: cada acción arma a mano lo que sale.
 *
 * Requiere la variable de entorno SUPABASE_SERVICE_ROLE_KEY (Supabase →
 * Project Settings → API → service_role). No lleva NEXT_PUBLIC_: no tiene
 * que llegar nunca al navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno para la agenda online."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
