"use client";

import { useTransition } from "react";
import { Search, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { buscarClienteReserva } from "@/app/reservar/actions";
import { Aviso, Campo, Opcion, Seccion } from "./ui";
import { telefonoValido, type EstadoReserva } from "./estado";

export function PasoCliente({
  estado,
  actualizar,
}: {
  estado: EstadoReserva;
  actualizar: (cambios: Partial<EstadoReserva>) => void;
}) {
  const [buscando, startBusqueda] = useTransition();
  const { busqueda } = estado;

  const elegirModo = (modo: "nuevo" | "actual") => {
    if (modo === estado.modo) return;
    actualizar({
      modo,
      busqueda: { estado: "idle", vehiculos: [], error: null },
      vehiculoId: null,
    });
  };

  const buscar = () => {
    if (!telefonoValido(estado.telefono)) {
      actualizar({
        busqueda: {
          estado: "idle",
          vehiculos: [],
          error: "Revisá el celular: código de área sin el 0 y número sin el 15 (ej. 11 6972 8834).",
        },
      });
      return;
    }
    startBusqueda(async () => {
      const r = await buscarClienteReserva(estado.telefono);
      if ("error" in r) {
        actualizar({ busqueda: { estado: "idle", vehiculos: [], error: r.error } });
      } else if (r.encontrado) {
        actualizar({
          busqueda: { estado: "encontrado", vehiculos: r.vehiculos, error: null },
          vehiculoId: r.vehiculos[0]?.id ?? null,
        });
      } else {
        // Respuesta 3.3: le avisamos y sigue como cliente nuevo.
        actualizar({
          modo: "nuevo",
          busqueda: { estado: "no_encontrado", vehiculos: [], error: null },
          vehiculoId: null,
        });
      }
    });
  };

  return (
    <Seccion titulo="¿Ya viniste a JMF?" subtitulo="Así no te pedimos datos que ya tenemos.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Opcion seleccionada={estado.modo === "nuevo"} onClick={() => elegirModo("nuevo")}>
          <span className="flex items-center gap-3">
            <UserPlus size={20} className="text-rojo shrink-0" />
            <span>
              <span className="block text-sm font-medium text-texto">Es mi primera vez</span>
              <span className="block text-xs text-texto-secundario">Soy cliente nuevo</span>
            </span>
          </span>
        </Opcion>
        <Opcion seleccionada={estado.modo === "actual"} onClick={() => elegirModo("actual")}>
          <span className="flex items-center gap-3">
            <UserCheck size={20} className="text-rojo shrink-0" />
            <span>
              <span className="block text-sm font-medium text-texto">Ya soy cliente</span>
              <span className="block text-xs text-texto-secundario">Me buscan por celular</span>
            </span>
          </span>
        </Opcion>
      </div>

      {estado.modo === "actual" && (
        <div className="flex flex-col gap-3">
          <Campo
            label="Tu celular (el de WhatsApp)"
            htmlFor="telefono"
            ayuda="Con código de área, sin el 0 y sin el 15. Ej.: 11 6972 8834"
          >
            <div className="flex gap-2">
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={estado.telefono}
                onChange={(e) =>
                  actualizar({
                    telefono: e.target.value,
                    busqueda: { estado: "idle", vehiculos: [], error: null },
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscar();
                  }
                }}
                className="campo"
                placeholder="11 6972 8834"
              />
              <button
                type="button"
                onClick={buscar}
                disabled={buscando}
                className="inline-flex items-center gap-2 rounded-lg bg-rojo px-4 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60 shrink-0"
              >
                {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </div>
          </Campo>
          {busqueda.error && <Aviso tono="error">{busqueda.error}</Aviso>}
          {busqueda.estado === "encontrado" && (
            <Aviso tono="ok">
              ¡Hola de nuevo! Encontramos tus datos
              {busqueda.vehiculos.length > 0
                ? ` y ${busqueda.vehiculos.length === 1 ? "tu auto" : `tus ${busqueda.vehiculos.length} autos`}.`
                : "."}{" "}
              Tocá «Siguiente» para seguir.
            </Aviso>
          )}
        </div>
      )}

      {estado.modo === "nuevo" && (
        <div className="flex flex-col gap-4">
          {busqueda.estado === "no_encontrado" && (
            <Aviso tono="premium">
              No encontramos ese celular entre nuestros clientes. No pasa nada: seguimos como cliente nuevo,
              completá tu nombre.
            </Aviso>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Nombre y apellido" htmlFor="nombre">
              <input
                id="nombre"
                autoComplete="name"
                value={estado.nombre}
                onChange={(e) => actualizar({ nombre: e.target.value })}
                className="campo"
                placeholder="Juan Pérez"
              />
            </Campo>
            <Campo
              label="Celular (el de WhatsApp)"
              htmlFor="telefono-nuevo"
              ayuda="Con código de área, sin el 0 y sin el 15."
            >
              <input
                id="telefono-nuevo"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={estado.telefono}
                onChange={(e) => actualizar({ telefono: e.target.value })}
                className="campo"
                placeholder="11 6972 8834"
              />
            </Campo>
          </div>
          <Campo label="Email" htmlFor="email" opcional>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={estado.email}
              onChange={(e) => actualizar({ email: e.target.value })}
              className="campo"
              placeholder="tu@email.com"
            />
          </Campo>
        </div>
      )}
    </Seccion>
  );
}
