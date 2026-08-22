import { listarAutosClassmotor } from "@/lib/data/classmotor";
import { TableroClassmotorClient } from "@/components/classmotor/TableroClassmotorClient";

export default async function ClassmotorPage() {
  const autos = await listarAutosClassmotor();
  return <TableroClassmotorClient autos={autos} />;
}
