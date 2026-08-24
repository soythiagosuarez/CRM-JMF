import { Mail } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CambiarPasswordForm } from "@/components/config/CambiarPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ConfigPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-texto">Config</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Cuenta del login compartido de JMF.
        </p>
      </div>

      <Card>
        <CardHeader title="Cuenta" subtitle="Un solo usuario compartido, sin roles (§2)" />
        <p className="flex items-center gap-2 text-sm text-texto">
          <Mail size={16} className="text-texto-secundario" />
          {user?.email ?? "—"}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Cambiar contraseña"
          subtitle="La usan Joaco, Thiago y el equipo para entrar al sistema"
        />
        <CambiarPasswordForm />
      </Card>
    </div>
  );
}
