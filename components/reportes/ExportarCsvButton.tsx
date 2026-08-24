"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MARCA_LABEL } from "@/lib/types/movimiento";
import type { Movimiento } from "@/lib/types/movimiento";

function celdaCsv(valor: string): string {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

export function ExportarCsvButton({
  movimientos,
  nombreArchivo,
}: {
  movimientos: Movimiento[];
  nombreArchivo: string;
}) {
  const exportar = () => {
    const encabezado = ["Fecha", "Tipo", "Marca", "Categoría", "Descripción", "Medio de pago", "Monto ARS"];
    const filas = movimientos.map((m) => [
      m.fecha,
      m.tipo,
      MARCA_LABEL[m.marca],
      m.categoria,
      m.descripcion ?? "",
      m.medio_pago ?? "",
      String(m.monto_ars),
    ]);

    const csv = [encabezado, ...filas].map((fila) => fila.map(celdaCsv).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreArchivo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variante="secundario" onClick={exportar} disabled={movimientos.length === 0}>
      <Download size={16} />
      Exportar CSV
    </Button>
  );
}
