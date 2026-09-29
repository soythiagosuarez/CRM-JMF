"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { registrarAviso } from "@/app/(app)/clientes/fidelizacion/actions";
import { linkWhatsapp, mensajePremiosDisponibles } from "@/lib/whatsapp";

/**
 * Abre WhatsApp con el mensaje de premios aprobado (respuesta 12.2) y, al
 * mismo tiempo, deja registrado que se le avisó — así el CRM sabe cuándo
 * volver a avisar si no responde.
 */
export function BotonAvisarPremio({
  clienteId,
  nombre,
  telefono,
  saldo,
  premios,
  reaviso = false,
}: {
  clienteId: string;
  nombre: string;
  telefono: string | null;
  saldo: number;
  premios: string[];
  reaviso?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (!telefono) {
    return <span className="text-xs text-texto-secundario">Sin celular cargado</span>;
  }

  return (
    <a
      href={linkWhatsapp(telefono, mensajePremiosDisponibles(nombre.split(" ")[0], saldo, premios))}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => startTransition(() => registrarAviso(clienteId))}
      aria-disabled={isPending}
      className="inline-flex items-center gap-1.5 text-sm text-verde hover:underline whitespace-nowrap"
    >
      <MessageCircle size={14} />
      {reaviso ? "Volver a avisar" : "Avisar por WhatsApp"}
    </a>
  );
}
