import { listarOrdenes } from "@/lib/data/ordenes";
import { listarTurnosEnRango } from "@/lib/data/turnos";
import { hoyISO } from "@/lib/agenda-dates";
import { TableroClient } from "@/components/autos/TableroClient";

export default async function AutosPage() {
  const hoy = hoyISO();
  const [ordenes, turnosHoy] = await Promise.all([
    listarOrdenes(),
    listarTurnosEnRango(hoy, hoy),
  ]);

  const esperandoIngreso = turnosHoy.filter((t) => t.estado === "agendado");

  return <TableroClient ordenes={ordenes} esperandoIngreso={esperandoIngreso} />;
}
