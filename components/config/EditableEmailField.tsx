"use client";

import { useState } from "react";
import { Mail, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function EditableEmailField({ emailActual }: { emailActual: string }) {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState(emailActual);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    setAbierto(false);
    setError(null);
    setOk(false);
    setEmail(emailActual);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const supabase = createClient();
    const { error: errorSupabase } = await supabase.auth.updateUser({ email });
    setEnviando(false);

    if (errorSupabase) {
      setError("No se pudo cambiar el email: " + errorSupabase.message);
      return;
    }
    setOk(true);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm text-texto">
          <Mail size={16} className="text-texto-secundario" />
          {emailActual}
        </p>
        <button
          onClick={() => setAbierto(true)}
          className="text-texto-secundario hover:text-texto"
          aria-label="Editar email"
        >
          <Pencil size={14} />
        </button>
      </div>

      {abierto && (
        <Modal titulo="Editar email" onCerrar={cerrar}>
          {ok ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-verde">
                Te enviamos un correo de confirmación a la nueva dirección. El cambio se aplica
                recién cuando lo confirmes desde ahí.
              </p>
              <Button onClick={cerrar} className="self-start">
                Listo
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm text-texto-secundario">
                  Nuevo email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="campo"
                />
              </div>

              {error && (
                <p className="text-sm text-rojo" role="alert">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variante="secundario" onClick={cerrar}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={enviando || email === emailActual}>
                  {enviando ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
