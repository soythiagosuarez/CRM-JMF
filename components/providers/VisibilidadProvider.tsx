"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const CLAVE_STORAGE = "jmf_montos_ocultos";
const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((l) => l());
}

function suscribirse(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function obtenerSnapshot(): boolean {
  try {
    return localStorage.getItem(CLAVE_STORAGE) === "1";
  } catch {
    return false;
  }
}

/** Durante el render en el servidor no hay localStorage — arranca visible
 * y se corrige solo al hidratar en el navegador (useSyncExternalStore
 * está pensado justo para esto, sin el warning de mismatch de hidratación). */
function obtenerSnapshotServidor(): boolean {
  return false;
}

function establecer(oculto: boolean) {
  try {
    localStorage.setItem(CLAVE_STORAGE, oculto ? "1" : "0");
  } catch {
    // no se pudo persistir (modo privado, etc.) — sigue andando en memoria.
  }
  emitir();
}

interface VisibilidadContextValor {
  oculto: boolean;
  alternar: () => void;
}

const VisibilidadContext = createContext<VisibilidadContextValor | null>(null);

/**
 * Estado compartido para ocultar/mostrar los montos de todo el negocio
 * (Inicio, Finanzas, Reportes, etc.) con un solo click — útil cuando hay
 * gente cerca de la pantalla y no querés que vea números de facturación.
 * Es por dispositivo (localStorage), no se sincroniza entre pantallas.
 */
export function VisibilidadProvider({ children }: { children: React.ReactNode }) {
  const oculto = useSyncExternalStore(suscribirse, obtenerSnapshot, obtenerSnapshotServidor);
  const alternar = useCallback(() => establecer(!oculto), [oculto]);

  return (
    <VisibilidadContext.Provider value={{ oculto, alternar }}>
      {children}
    </VisibilidadContext.Provider>
  );
}

export function useVisibilidadFinanciera(): VisibilidadContextValor {
  const ctx = useContext(VisibilidadContext);
  if (!ctx) {
    throw new Error("useVisibilidadFinanciera tiene que usarse dentro de VisibilidadProvider");
  }
  return ctx;
}
