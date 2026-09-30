import Link from "next/link";
import { Search, Car, Gift, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Monto } from "@/components/ui/Monto";
import { buscarClientes, obtenerClientesPorIds } from "@/lib/data/clientes";
import { obtenerResumenesFidelizacion, RESUMEN_VACIO } from "@/lib/data/fidelizacion";
import { NuevoClienteToggle } from "@/components/clientes/NuevoClienteToggle";
import type { Cliente, OrigenCliente } from "@/lib/types/cliente";
import type { ResumenFidelizacion } from "@/lib/types/fidelizacion";

type Vista = "todos" | "premio" | "ranking";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "premio", label: "Con premio disponible" },
  { id: "ranking", label: "Ranking de mejores clientes" },
];

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; origen?: string; vista?: string }>;
}) {
  const { q, origen: origenParam, vista: vistaParam } = await searchParams;
  const origen: OrigenCliente = origenParam === "classmotor" ? "classmotor" : "detailing";
  // La fidelización es solo para clientes de Detailing.
  const conPuntos = origen === "detailing";
  const vista: Vista =
    conPuntos && (vistaParam === "premio" || vistaParam === "ranking") ? vistaParam : "todos";
  const resumenes = conPuntos ? await obtenerResumenesFidelizacion() : new Map<string, ResumenFidelizacion>();
  const resumenDe = (id: string) => resumenes.get(id) ?? RESUMEN_VACIO;

  let clientes: Cliente[];
  if (vista === "todos") {
    clientes = await buscarClientes(q, origen);
  } else {
    // Premio: los que ya pueden canjear algo, con más puntos primero.
    // Ranking: los que más gastaron (órdenes cobradas).
    const ids = [...resumenes.entries()]
      .filter(([, r]) => (vista === "premio" ? r.premios_disponibles.length > 0 : r.total_gastado > 0))
      .sort(([, a], [, b]) => (vista === "premio" ? b.saldo - a.saldo : b.total_gastado - a.total_gastado))
      .map(([id]) => id);
    const porId = new Map((await obtenerClientesPorIds(ids)).map((c) => [c.id, c]));
    clientes = ids
      .map((id) => porId.get(id))
      .filter((c): c is Cliente => !!c && c.origen === origen)
      .slice(0, 50);
  }

  const href = (cambios: { origen?: OrigenCliente; vista?: Vista }) => {
    const params = new URLSearchParams();
    const o = cambios.origen ?? origen;
    params.set("origen", o);
    const v = o === "detailing" ? (cambios.vista ?? vista) : "todos";
    if (v !== "todos") params.set("vista", v);
    if (q && v === "todos") params.set("q", q);
    return `/clientes?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-texto">Clientes</h1>
          <p className="text-sm text-texto-secundario mt-1">
            {conPuntos
              ? "Ficha con datos, vehículos, historial y puntos. Búsqueda por nombre o patente."
              : "Ficha con datos, vehículos e historial. Búsqueda por nombre o patente."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {conPuntos && (
            <Link
              href="/clientes/fidelizacion"
              className="inline-flex items-center gap-2 rounded-lg border border-dorado/40 px-4 py-2 text-sm font-medium text-dorado hover:bg-dorado/10"
            >
              <Gift size={16} />
              Premios y puntos
            </Link>
          )}
          <NuevoClienteToggle origenInicial={origen} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-borde overflow-hidden">
          {(["detailing", "classmotor"] as OrigenCliente[]).map((o) => (
            <Link
              key={o}
              href={href({ origen: o })}
              className={`px-4 py-1.5 text-sm capitalize ${
                origen === o ? "bg-rojo/10 text-rojo" : "text-texto-secundario hover:text-texto"
              }`}
            >
              Clientes {o === "detailing" ? "Detailing" : "Classmotor"}
            </Link>
          ))}
        </div>
        {conPuntos && (
          <div className="flex flex-wrap rounded-lg border border-borde overflow-hidden">
            {VISTAS.map((v) => (
              <Link
                key={v.id}
                href={href({ vista: v.id })}
                className={`px-3 py-1.5 text-sm ${
                  vista === v.id ? "bg-dorado/10 text-dorado" : "text-texto-secundario hover:text-texto"
                }`}
              >
                {v.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {vista === "todos" && (
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
      )}

      {clientes.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">
            {vista === "premio"
              ? "Ningún cliente tiene puntos suficientes para un premio todavía."
              : vista === "ranking"
                ? "Todavía no hay órdenes cobradas para armar el ranking."
                : q
                  ? "No encontramos clientes con esa búsqueda."
                  : "Todavía no hay clientes acá."}
          </p>
          <p className="text-sm text-texto-secundario max-w-sm">
            {vista !== "todos"
              ? "Los puntos se suman solos al cobrar una orden en Gestión Detailing."
              : q
                ? "Probá con otro nombre o patente."
                : origen === "detailing"
                  ? 'Los clientes nuevos se cargan solos al agendarles un turno en Agenda o cuando reservan por la agenda online, o usá "Cargar cliente existente".'
                  : 'Los clientes nuevos se cargan solos al ingresar un auto en Classmotor, o usá "Cargar cliente existente".'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clientes.map((c, i) => {
            const r = resumenDe(c.id);
            return (
              <Link key={c.id} href={`/clientes/${c.id}`}>
                <Card className="h-full hover:border-rojo/50 transition-colors flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-base font-semibold text-texto truncate">
                      {vista === "ranking" && <span className="text-dorado mr-1.5">#{i + 1}</span>}
                      {c.nombre_completo}
                    </p>
                    {conPuntos && r.premios_disponibles.length > 0 && (
                      <Badge tono="premium">
                        <Gift size={12} className="mr-1" />
                        Premio
                      </Badge>
                    )}
                  </div>
                  {c.telefono && <p className="text-sm text-texto-secundario">{c.telefono}</p>}
                  {c.como_llego && (
                    <p className="text-xs text-texto-secundario flex items-center gap-1.5">
                      <Car size={12} />
                      {c.como_llego}
                    </p>
                  )}
                  {conPuntos && (
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-borde text-xs">
                      <span className="inline-flex items-center gap-1 text-dorado tabular-nums">
                        <Star size={12} /> {r.saldo} pts
                      </span>
                      <span className="text-texto-secundario">
                        Gastó <Monto valor={r.total_gastado} className="text-texto tabular-nums" />
                      </span>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
