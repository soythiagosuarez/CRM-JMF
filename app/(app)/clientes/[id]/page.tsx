import { notFound } from "next/navigation";
import { obtenerCliente } from "@/lib/data/clientes";
import { FichaClienteClient } from "@/components/clientes/FichaClienteClient";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);

  if (!cliente) notFound();

  return <FichaClienteClient cliente={cliente} />;
}
