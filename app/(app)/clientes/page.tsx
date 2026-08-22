import Link from "next/link";
import { Search, Car } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buscarClientes } from "@/lib/data/clientes";
import { NuevoClienteToggle } from "@/components/clientes/NuevoClienteToggle";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clientes = await buscarClientes(q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Clientes</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Ficha con datos, vehículos e historial. Búsqueda por nombre o patente.
          </p>
        </div>
        <NuevoClienteToggle />
      </div>

      <form method="GET" className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario"
          />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o patente..."
            className="campo pl-9"
          />
        </div>
      </form>

      {clientes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">
            {q ? "No encontramos clientes con esa búsqueda." : "Todavía no hay clientes cargados."}
          </p>
          <p className="text-sm text-texto-secundario max-w-sm">
            {q
              ? "Probá con otro nombre o patente."
              : 'Usá "Nuevo cliente" para cargar el primero.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clientes.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <Card className="h-full hover:border-rojo/50 transition-colors">
                <p className="font-display text-base font-semibold text-texto truncate">
                  {c.nombre_completo}
                </p>
                {c.telefono && (
                  <p className="text-sm text-texto-secundario mt-1">{c.telefono}</p>
                )}
                {c.como_llego && (
                  <p className="text-xs text-texto-secundario mt-2 flex items-center gap-1.5">
                    <Car size={12} />
                    {c.como_llego}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
