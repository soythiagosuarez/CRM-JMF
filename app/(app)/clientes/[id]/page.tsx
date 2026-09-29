import { notFound } from "next/navigation";
import { obtenerCliente } from "@/lib/data/clientes";
import { listarOrdenesPorCliente } from "@/lib/data/ordenes";
import { listarServicios } from "@/lib/data/servicios";
import { listarTurnosPorCliente } from "@/lib/data/turnos";
import { obtenerFidelizacionCliente } from "@/lib/data/fidelizacion";
import { obtenerConfiguracion } from "@/lib/data/config";
import { FichaClienteClient } from "@/components/clientes/FichaClienteClient";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);

  if (!cliente) notFound();

  const [historial, servicios, turnos, fidelizacion, configuracion] = await Promise.all([
    listarOrdenesPorCliente(id),
    listarServicios(),
    listarTurnosPorCliente(id),
    obtenerFidelizacionCliente(id),
    obtenerConfiguracion(),
  ]);

  return (
    <FichaClienteClient
      cliente={cliente}
      historial={historial}
      servicios={servicios.filter((s) => s.activo)}
      turnos={turnos}
      fidelizacion={fidelizacion}
      configFidelizacion={configuracion.fidelizacion}
    />
  );
}
