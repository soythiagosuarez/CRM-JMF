import { LogOut } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CambiarPasswordForm } from "@/components/config/CambiarPasswordForm";
import { EditableEmailField } from "@/components/config/EditableEmailField";
import { EditableHorariosForm } from "@/components/config/EditableHorariosForm";
import { EditableCategoriasForm } from "@/components/config/EditableCategoriasForm";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import { obtenerConfiguracion } from "@/lib/data/config";

export default async function ConfigPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    configuracion,
  ] = await Promise.all([supabase.auth.getUser(), obtenerConfiguracion()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-texto">Config</h1>
        <p className="text-sm text-texto-secundario mt-1">
          Cuenta del login compartido de JMF y ajustes del negocio.
        </p>
      </div>

      <Card>
        <CardHeader title="Cuenta" subtitle="Un solo usuario compartido, sin roles (§2)" />
        <div className="flex flex-col gap-4">
          <EditableEmailField emailActual={user?.email ?? ""} />
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm text-texto-secundario hover:text-rojo transition-colors"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Cambiar contraseña"
          subtitle="La usan Joaco, Thiago y el equipo para entrar al sistema"
        />
        <CambiarPasswordForm />
      </Card>

      <Card>
        <CardHeader
          title="Horarios de atención"
          subtitle="Se usan para validar los turnos que se agendan en Agenda (§6.4)"
        />
        <EditableHorariosForm horarios={configuracion.horarios} />
      </Card>

      <Card>
        <CardHeader
          title="Categorías de movimientos"
          subtitle="Las categorías que ofrece Finanzas al cargar un egreso, por marca"
        />
        <EditableCategoriasForm categoriasMovimiento={configuracion.categorias_movimiento} />
      </Card>
    </div>
  );
}
