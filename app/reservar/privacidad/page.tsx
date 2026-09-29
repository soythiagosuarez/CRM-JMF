import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIG_RESERVAS_DEFAULT, formatearWhatsapp, normalizarConfigReservas } from "@/lib/reservas/config";

export const metadata: Metadata = {
  title: "Privacidad · JMF Detailing",
  description: "Cómo usamos los datos que cargás al reservar un turno en JMF Detailing.",
};

/**
 * Política de privacidad básica (respuesta 13.2), para cumplir con el
 * deber de informar de la Ley 25.326 al pedir datos en una página
 * pública. Texto simple, pensado para que lo revise Joaco.
 */
export default async function PrivacidadPage() {
  await connection();
  let { whatsapp, direccion } = CONFIG_RESERVAS_DEFAULT;
  try {
    const { data } = await createAdminClient().from("configuracion").select("reservas").eq("id", "global").single();
    ({ whatsapp, direccion } = normalizarConfigReservas(data?.reservas));
  } catch {
    // Sin conexión a la base: se muestran los datos por defecto.
  }

  return (
    <div className="w-full px-4 py-10">
      <article className="mx-auto max-w-2xl flex flex-col gap-5 text-sm leading-relaxed text-texto-secundario">
        <h1 className="font-display text-2xl font-semibold text-texto">Política de privacidad</h1>

        <p>
          JMF Detailing ({direccion}) es responsable de los datos que cargás al reservar un turno en esta
          página.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base font-semibold text-texto">Qué datos pedimos</h2>
          <p>
            Tu nombre, tu celular, tu email si lo querés dejar, los datos de tu auto (marca, modelo, año, patente,
            color y tamaño), los servicios que elegís y cómo nos conociste.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base font-semibold text-texto">Para qué los usamos</h2>
          <p>
            Para agendar y gestionar tu turno, comunicarnos con vos por WhatsApp sobre el servicio, llevar el
            historial de los trabajos que le hacemos a tu auto, avisarte cuándo toca un mantenimiento y sumar
            los puntos de nuestro programa de beneficios. Solo te mandamos promociones si marcaste esa opción al
            reservar.
          </p>
          <p>No vendemos ni compartimos tus datos con terceros.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-base font-semibold text-texto">Tus derechos</h2>
          <p>
            Podés pedirnos en cualquier momento ver, corregir o borrar tus datos, o dejar de recibir promociones,
            escribiéndonos por WhatsApp al {formatearWhatsapp(whatsapp)}. Tenés derecho a acceder a tus datos en
            forma gratuita cada seis meses, salvo que acredites un interés legítimo para hacerlo antes (Ley
            25.326, art. 14 inc. 3).
          </p>
          <p>
            La Agencia de Acceso a la Información Pública, órgano de control de la Ley 25.326, atiende las
            denuncias y reclamos de quienes resulten afectados en sus derechos por el incumplimiento de las normas
            sobre protección de datos personales.
          </p>
        </section>

        <Link href="/reservar" className="text-rojo hover:underline self-start">
          Volver a reservar un turno
        </Link>
      </article>
    </div>
  );
}
