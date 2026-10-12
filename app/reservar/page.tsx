import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerContextoAgenda } from "@/lib/reservas/datos";
import { CONFIG_RESERVAS_DEFAULT, formatearWhatsapp } from "@/lib/reservas/config";
import { ReservaFlujo } from "@/components/reservas/ReservaFlujo";
import type { DatosAgendaPublica } from "@/lib/types/reserva";

export const metadata: Metadata = {
  title: "Reservá tu turno · JMF Detailing",
  description:
    "Elegí el servicio, el día y el horario para dejar tu auto en JMF Detailing. Te confirmamos por WhatsApp.",
};

/**
 * Agenda online pública: se comparte por link (Instagram, WhatsApp
 * Business, Google Maps, QR) y se embebe en la web de JMF Detailing con
 * ?embed=1 (sin encabezado, para que quede dentro de la página).
 */
export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ embed?: string }>;
}) {
  await connection();
  const { embed } = await searchParams;
  const embebida = embed === "1";

  let datos: DatosAgendaPublica | null = null;
  try {
    const ctx = await obtenerContextoAgenda(createAdminClient());
    datos = {
      hoy: ctx.hoy,
      horaActual: ctx.horaActual ?? "00:00",
      config: ctx.config,
      servicios: ctx.reservables,
      ocupaciones: ctx.ocupaciones,
      bloqueos: ctx.bloqueos.map(({ fecha, franja_desde }) => ({ fecha, franja_desde })),
    };
  } catch (e) {
    console.error("Agenda online no disponible", e);
  }

  return (
    <div
      className={`flex w-full flex-1 flex-col ${
        // Embebida: mismo fondo que la web de JMF (#070707), así la agenda
        // se ve parte de la página y no un recuadro aparte.
        embebida ? "bg-[#070707] px-1 py-4" : "min-h-dvh px-4 pt-8 sm:pt-12 md:px-[120px]"
      }`}
    >
      <div className="flex w-full flex-1 flex-col gap-6">
        {!embebida && (
          <header className="flex flex-col items-center gap-3 text-center">
            <Image src="/brands/detailing.png" alt="JMF Detailing" width={150} height={100} priority />
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-texto">
                Reservá tu turno
              </h1>
              <p className="text-sm text-texto-secundario mt-1">
                Elegí el servicio, el día y el horario para dejar tu auto. Te lleva un par de minutos.
              </p>
            </div>
          </header>
        )}

        {datos && datos.servicios.length > 0 ? (
          <ReservaFlujo datos={datos} embebida={embebida} />
        ) : (
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-borde bg-panel p-6 text-center flex flex-col gap-2">
            <p className="text-texto">La agenda online no está disponible en este momento.</p>
            <p className="text-sm text-texto-secundario">
              Escribinos por WhatsApp al{" "}
              <a
                href={`https://wa.me/${CONFIG_RESERVAS_DEFAULT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-verde hover:underline"
              >
                {formatearWhatsapp(CONFIG_RESERVAS_DEFAULT.whatsapp)}
              </a>{" "}
              y coordinamos tu turno.
            </p>
          </div>
        )}
      </div>

      {/* Siempre al pie de la pantalla, a 60px del borde: no se mueve
          con los botones ni con el largo de cada paso. */}
      {!embebida && (
        <footer className="mt-10 mb-[60px] text-center text-xs text-texto-secundario">
          JMF Detailing · {datos?.config.direccion ?? CONFIG_RESERVAS_DEFAULT.direccion} ·{" "}
          <Link href="/reservar/privacidad" className="hover:text-texto underline underline-offset-2">
            Privacidad
          </Link>
        </footer>
      )}
    </div>
  );
}
