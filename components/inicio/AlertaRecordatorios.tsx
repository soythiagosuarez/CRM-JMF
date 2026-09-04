"use client";

import { useTransition } from "react";
import { Bell, X } from "lucide-react";
import { descartarAlerta } from "@/app/(app)/recordatorios/actions";
import type { RecordatorioConDatos } from "@/lib/types/recordatorio";

/**
 * Banner de alertas en Inicio (§ feedback): el aviso de un recordatorio
 * es esto — algo dentro del CRM que Joaco tiene que cerrar para
 * confirmar que lo vio — no un envío por WhatsApp/SMS/Gmail.
 */
export function AlertaRecordatorios({ alertas }: { alertas: RecordatorioConDatos[] }) {
  const [isPending, startTransition] = useTransition();

  if (alertas.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alertas.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-dorado/40 bg-dorado/10 px-4 py-3"
        >
          <p className="flex items-center gap-2 text-sm text-texto min-w-0">
            <Bell size={16} className="text-dorado shrink-0" />
            <span className="truncate">{r.titulo}</span>
          </p>
          <button
            onClick={() => startTransition(() => descartarAlerta(r.id))}
            disabled={isPending}
            className="text-texto-secundario hover:text-texto disabled:opacity-50 shrink-0"
            aria-label="Cerrar alerta"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
