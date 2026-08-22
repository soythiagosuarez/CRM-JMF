"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClienteForm } from "./ClienteForm";
import { crearCliente } from "@/app/(app)/clientes/actions";

export function NuevoClienteToggle() {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <Button onClick={() => setAbierto(true)}>
        <Plus size={16} />
        Cargar cliente existente
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader
        title="Cargar cliente existente"
        subtitle="Para migrar contactos de tu Excel, WhatsApp o libreta. Los clientes nuevos se cargan solos al agendarles un turno en Agenda."
      />
      <ClienteForm
        accion={crearCliente}
        onCancelar={() => setAbierto(false)}
        textoBoton="Cargar cliente"
      />
    </Card>
  );
}
