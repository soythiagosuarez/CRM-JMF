"use client";

import Image from "next/image";
import { useActionState } from "react";
import { iniciarSesion, type EstadoLogin } from "./actions";
import { Button } from "@/components/ui/Button";

const estadoInicial: EstadoLogin = {};

export default function LoginPage() {
  const [estado, formAction, enviando] = useActionState(
    iniciarSesion,
    estadoInicial
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src="/brands/detailing.png" alt="JMF" width={220} height={147} />
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-texto leading-tight">
              Centro de Operaciones
            </p>
            <p className="text-sm text-texto-secundario">
              Detailing · Shop · Classmotor
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-4 rounded-xl border border-borde bg-panel p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-texto-secundario">
              Usuario
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="rounded-lg border border-borde bg-fondo-2 px-3 py-2 text-sm text-texto outline-none focus-visible:border-rojo"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm text-texto-secundario"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-borde bg-fondo-2 px-3 py-2 text-sm text-texto outline-none focus-visible:border-rojo"
            />
          </div>

          {estado.error && (
            <p className="text-sm text-rojo" role="alert">
              {estado.error}
            </p>
          )}

          <Button type="submit" disabled={enviando} className="mt-2 w-full">
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
