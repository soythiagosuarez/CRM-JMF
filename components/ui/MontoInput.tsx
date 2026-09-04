"use client";

import { useId, useState } from "react";

/**
 * Input de precio/monto en formato argentino: el punto se interpreta
 * como separador de miles (250.000 = doscientos cincuenta mil), no como
 * decimal — el <input type="number"> nativo lo interpretaba al revés
 * (250.000 → 250) y generaba movimientos con montos mil veces menores.
 *
 * Muestra un campo de texto formateado (250.000) y manda al formulario
 * un input oculto con el valor numérico real (250000) vía `name`.
 */
export function formatearAR(valor: string): string {
  const limpio = valor.replace(/[^\d,]/g, "");
  const primeraComa = limpio.indexOf(",");
  const entero = (primeraComa === -1 ? limpio : limpio.slice(0, primeraComa)).replace(/^0+(?=\d)/, "");
  const decimal = primeraComa === -1 ? "" : limpio.slice(primeraComa + 1).replace(/,/g, "").slice(0, 2);
  const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return primeraComa === -1 ? enteroFormateado : `${enteroFormateado},${decimal}`;
}

export function aValorNumerico(formateado: string): string {
  return formateado.replace(/\./g, "").replace(",", ".");
}

/** Convierte un número "de la base" (JS/DB, punto = decimal, ej 1050.5)
 * al formato de display argentino (punto = miles, coma = decimal). Solo
 * para inicializar el campo — mientras el usuario tipea se usa
 * formatearAR, donde el punto que escribe representa miles. */
function formatearValorInicial(valor: string): string {
  const [entero, decimal] = valor.split(".");
  const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decimal && Number(decimal) > 0) {
    return `${enteroFormateado},${decimal.slice(0, 2)}`;
  }
  return enteroFormateado;
}

export function MontoInput({
  name,
  id,
  defaultValue,
  required,
  placeholder,
  className = "campo",
}: {
  name: string;
  id?: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [display, setDisplay] = useState(() =>
    defaultValue != null && defaultValue !== "" ? formatearValorInicial(String(defaultValue)) : ""
  );

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        id={inputId}
        value={display}
        onChange={(e) => setDisplay(formatearAR(e.target.value))}
        required={required}
        placeholder={placeholder}
        className={className}
      />
      <input type="hidden" name={name} value={aValorNumerico(display)} />
    </>
  );
}
