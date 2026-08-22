import { listarProximosTurnos } from "@/lib/data/turnos";
import { listarClientesConVehiculos } from "@/lib/data/clientes";
import { listarServicios } from "@/lib/data/servicios";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export default async function AgendaPage() {
  const [turnos, clientes, servicios] = await Promise.all([
    listarProximosTurnos(),
    listarClientesConVehiculos(),
    listarServicios(),
  ]);

  return (
    <AgendaClient
      turnos={turnos}
      clientes={clientes}
      servicios={servicios.filter((s) => s.activo)}
    />
  );
}
