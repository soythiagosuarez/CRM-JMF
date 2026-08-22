import { listarOrdenes } from "@/lib/data/ordenes";
import { TableroClient } from "@/components/autos/TableroClient";

export default async function AutosPage() {
  const ordenes = await listarOrdenes();
  return <TableroClient ordenes={ordenes} />;
}
