import { listarOrdenes } from "@/lib/data/ordenes";
import { listarTurnosEnRango } from "@/lib/data/turnos";
import { listarClientesConVehiculos } from "@/lib/data/clientes";
import { listarServicios } from "@/lib/data/servicios";
import { obtenerConfiguracion } from "@/lib/data/config";
import { hoyISO } from "@/lib/agenda-dates";
import { TableroClient } from "@/components/autos/TableroClient";

export default async function AutosPage() {
  const hoy = hoyISO();
  const [ordenes, turnosHoy, clientes, servicios, configuracion] = await Promise.all([
    listarOrdenes(),
    listarTurnosEnRango(hoy, hoy),
    listarClientesConVehiculos(),
    listarServicios(),
    obtenerConfiguracion(),
  ]);

  const esperandoIngreso = turnosHoy.filter((t) => t.estado === "agendado");

  return (
    <TableroClient
      ordenes={ordenes}
      esperandoIngreso={esperandoIngreso}
      clientes={clientes}
      servicios={servicios.filter((s) => s.activo)}
      horarios={configuracion.horarios}
    />
  );
}
