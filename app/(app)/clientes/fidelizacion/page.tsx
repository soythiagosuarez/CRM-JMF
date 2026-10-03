import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listarPremios } from "@/lib/data/fidelizacion";
import { obtenerConfiguracion } from "@/lib/data/config";
import { PremiosClient } from "@/components/clientes/PremiosClient";

export default async function FidelizacionPage() {
  const [premios, configuracion] = await Promise.all([listarPremios(), obtenerConfiguracion()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-texto-secundario hover:text-texto">
          <ArrowLeft size={14} /> Clientes
        </Link>
        <h1 className="font-display text-2xl font-semibold text-texto mt-2">Premios y puntos</h1>
        <p className="text-sm text-texto-secundario mt-1">
          El catálogo de premios y las reglas del programa de fidelización.
        </p>
      </div>
      <PremiosClient premios={premios} config={configuracion.fidelizacion} />
    </div>
  );
}
