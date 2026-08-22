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
        Nuevo cliente
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader title="Nuevo cliente" />
      <ClienteForm
        accion={crearCliente}
        onCancelar={() => setAbierto(false)}
        textoBoton="Crear cliente"
      />
    </Card>
  );
}
