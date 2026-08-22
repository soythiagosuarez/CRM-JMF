import { listarTurnosEnRango } from "@/lib/data/turnos";
import { listarClientesConVehiculos } from "@/lib/data/clientes";
import { listarServicios } from "@/lib/data/servicios";
import { CalendarioClient } from "@/components/agenda/CalendarioClient";
import { rangoMes, rangoSemana, hoyISO } from "@/lib/agenda-dates";

type Vista = "mes" | "semana" | "dia";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; fecha?: string }>;
}) {
  const params = await searchParams;
  const vista: Vista =
    params.vista === "semana" || params.vista === "dia" ? params.vista : "mes";
  const fecha = params.fecha && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha) ? params.fecha : hoyISO();

  const { desde, hasta } =
    vista === "mes" ? rangoMes(fecha) : vista === "semana" ? rangoSemana(fecha) : { desde: fecha, hasta: fecha };

  const [turnos, clientes, servicios] = await Promise.all([
    listarTurnosEnRango(desde, hasta),
    listarClientesConVehiculos(),
    listarServicios(),
  ]);

  return (
    <CalendarioClient
      turnos={turnos}
      clientes={clientes}
      servicios={servicios.filter((s) => s.activo)}
      vista={vista}
      fecha={fecha}
    />
  );
}
