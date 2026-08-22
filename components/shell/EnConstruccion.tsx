import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Construction } from "lucide-react";

export function EnConstruccion({
  titulo,
  logo,
}: {
  titulo: string;
  logo?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-texto">{titulo}</h1>
      <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        {logo ? (
          <Image src={logo} alt={titulo} width={160} height={107} priority />
        ) : (
          <Construction className="text-texto-secundario" size={28} />
        )}
        <p className="text-texto">Este módulo todavía no está construido.</p>
        <p className="text-sm text-texto-secundario max-w-sm">
          Se arma en el orden definido en ESPECIFICACION.md, después de aprobar las
          fundaciones.
        </p>
      </Card>
    </div>
  );
}
