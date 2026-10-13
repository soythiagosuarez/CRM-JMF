import Link from "next/link";
import { Inbox } from "lucide-react";
import type { ConsultaConFecha } from "@/lib/data/consultas";

/** Aviso en Inicio cuando entran consultas nuevas desde la web. Se va
 * solo cuando cada consulta deja de estar en «Nueva». */
export function AlertaConsultas({ consultas }: { consultas: ConsultaConFecha[] }) {
  if (consultas.length === 0) return null;
  const visibles = consultas.slice(0, 3);
  const resto = consultas.length - visibles.length;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rojo/40 bg-rojo/10 px-4 py-3 text-sm text-texto">
      <Inbox size={16} className="text-rojo shrink-0 mt-0.5" />
      <div className="min-w-0 flex flex-col gap-1">
        <p className="font-medium">
          {consultas.length === 1 ? "1 consulta nueva desde la web" : `${consultas.length} consultas nuevas desde la web`}
        </p>
        <ul className="flex flex-col gap-0.5 text-texto-secundario">
          {visibles.map((c) => (
            <li key={c.id} className="break-words">
              <span className="text-texto">{c.nombre}</span>
              {c.servicio ? ` · ${c.servicio}` : ""} · {c.fecha_texto}
            </li>
          ))}
          {resto > 0 && <li>y {resto} más</li>}
        </ul>
        <Link href="/consultas?vista=nueva" className="text-rojo hover:underline">
          Ver consultas
        </Link>
      </div>
    </div>
  );
}
