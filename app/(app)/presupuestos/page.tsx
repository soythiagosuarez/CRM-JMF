import { listarLeads } from "@/lib/data/leads";
import { listarClientesConVehiculos } from "@/lib/data/clientes";
import { listarServicios } from "@/lib/data/servicios";
import { PresupuestosClient } from "@/components/presupuestos/PresupuestosClient";

export default async function PresupuestosPage() {
  const [leads, clientes, servicios] = await Promise.all([
    listarLeads(),
    listarClientesConVehiculos(),
    listarServicios(),
  ]);

  return (
    <PresupuestosClient
      leads={leads}
      clientes={clientes}
      servicios={servicios.filter((s) => s.activo)}
    />
  );
}
