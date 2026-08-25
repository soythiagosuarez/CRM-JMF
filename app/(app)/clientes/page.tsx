import Link from "next/link";
import { Search, Car } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buscarClientes } from "@/lib/data/clientes";
import { NuevoClienteToggle } from "@/components/clientes/NuevoClienteToggle";
import type { OrigenCliente } from "@/lib/types/cliente";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; origen?: string }>;
}) {
  const { q, origen: origenParam } = await searchParams;
  const origen: OrigenCliente = origenParam === "classmotor" ? "classmotor" : "detailing";
  const clientes = await buscarClientes(q, origen);

  const hrefTab = (o: OrigenCliente) => `/clientes?origen=${o}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Clientes</h1>
          <p className="text-sm text-texto-secundario mt-1">
            Ficha con datos, vehículos e historial. Búsqueda por nombre o patente.
          </p>
        </div>
        <NuevoClienteToggle origenInicial={origen} />
      </div>

      <div className="flex rounded-lg border border-borde overflow-hidden self-start">
        {(["detailing", "classmotor"] as OrigenCliente[]).map((o) => (
          <Link
            key={o}
            href={hrefTab(o)}
            className={`px-4 py-1.5 text-sm capitalize ${
              origen === o ? "bg-rojo/10 text-rojo" : "text-texto-secundario hover:text-texto"
            }`}
          >
            Clientes {o === "detailing" ? "Detailing" : "Classmotor"}
          </Link>
        ))}
      </div>

      <form method="GET" className="flex gap-2 max-w-md">
        <input type="hidden" name="origen" value={origen} />
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
            {q ? "No encontramos clientes con esa búsqueda." : "Todavía no hay clientes acá."}
          </p>
          <p className="text-sm text-texto-secundario max-w-sm">
            {q
              ? "Probá con otro nombre o patente."
              : origen === "detailing"
                ? 'Los clientes nuevos se cargan solos al agendarles un turno en Agenda, o usá "Cargar cliente existente".'
                : 'Los clientes nuevos se cargan solos al ingresar un auto en Classmotor, o usá "Cargar cliente existente".'}
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
