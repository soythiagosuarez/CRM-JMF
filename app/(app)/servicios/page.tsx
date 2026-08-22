import { listarServicios } from "@/lib/data/servicios";
import { ServiciosClient } from "@/components/servicios/ServiciosClient";

export default async function ServiciosPage() {
  const servicios = await listarServicios();
  return <ServiciosClient servicios={servicios} />;
}
