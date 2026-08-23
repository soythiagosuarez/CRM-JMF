import { listarPresupuestos } from "@/lib/data/presupuestos";
import { listarServicios } from "@/lib/data/servicios";
import { PresupuestosClient } from "@/components/presupuestos/PresupuestosClient";

export default async function PresupuestosPage() {
  const [presupuestos, servicios] = await Promise.all([
    listarPresupuestos(),
    listarServicios(),
  ]);

  return (
    <PresupuestosClient presupuestos={presupuestos} servicios={servicios.filter((s) => s.activo)} />
  );
}
