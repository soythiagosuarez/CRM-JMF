import { listarAutosClassmotor } from "@/lib/data/classmotor";
import { listarClientesConVehiculos } from "@/lib/data/clientes";
import { TableroClassmotorClient } from "@/components/classmotor/TableroClassmotorClient";

export default async function ClassmotorPage() {
  const [autos, clientes] = await Promise.all([
    listarAutosClassmotor(),
    listarClientesConVehiculos(),
  ]);
  return <TableroClassmotorClient autos={autos} clientes={clientes} />;
}
