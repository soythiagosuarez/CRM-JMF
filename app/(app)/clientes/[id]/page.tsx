import { notFound } from "next/navigation";
import { obtenerCliente } from "@/lib/data/clientes";
import { listarOrdenesPorCliente } from "@/lib/data/ordenes";
import { listarServicios } from "@/lib/data/servicios";
import { FichaClienteClient } from "@/components/clientes/FichaClienteClient";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);

  if (!cliente) notFound();

  const [historial, servicios] = await Promise.all([
    listarOrdenesPorCliente(id),
    listarServicios(),
  ]);

  return (
    <FichaClienteClient
      cliente={cliente}
      historial={historial}
      servicios={servicios.filter((s) => s.activo)}
    />
  );
}
