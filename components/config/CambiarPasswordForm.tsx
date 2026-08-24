"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function CambiarPasswordForm() {
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (nueva.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (nueva !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const { error: errorSupabase } = await supabase.auth.updateUser({ password: nueva });
    setEnviando(false);

    if (errorSupabase) {
      setError("No se pudo cambiar la contraseña: " + errorSupabase.message);
      return;
    }

    setOk(true);
    setNueva("");
    setConfirmacion("");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nueva" className="text-sm text-texto-secundario">
          Nueva contraseña
        </label>
        <input
          id="nueva"
          type="password"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
          className="campo"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmacion" className="text-sm text-texto-secundario">
          Repetir contraseña
        </label>
        <input
          id="confirmacion"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          required
          className="campo"
        />
      </div>

      {error && (
        <p className="text-sm text-rojo" role="alert">
          {error}
        </p>
      )}
      {ok && <p className="text-sm text-verde">Contraseña actualizada.</p>}

      <Button type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
