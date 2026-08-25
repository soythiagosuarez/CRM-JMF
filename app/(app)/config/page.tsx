import { Mail, LogOut, Clock, Tag, Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CambiarPasswordForm } from "@/components/config/CambiarPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import { CATEGORIAS, MARCA_LABEL } from "@/lib/types/movimiento";
import type { MarcaMovimiento } from "@/lib/types/movimiento";

const MARCAS: MarcaMovimiento[] = ["detailing", "shop", "classmotor", "compartido"];

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
          Cuenta del login compartido de JMF y datos de referencia del sistema.
        </p>
      </div>

      <Card>
        <CardHeader title="Cuenta" subtitle="Un solo usuario compartido, sin roles (§2)" />
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm text-texto">
            <Mail size={16} className="text-texto-secundario" />
            {user?.email ?? "—"}
          </p>
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
        <div className="flex items-start gap-2 text-sm text-texto">
          <Clock size={16} className="text-texto-secundario shrink-0 mt-0.5" />
          <div>
            <p>Lunes a viernes: 9 a 18 hs</p>
            <p>Sábados: 10 a 13 hs</p>
            <p className="text-texto-secundario">Domingos: cerrado</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Categorías de movimientos"
          subtitle="Las categorías fijas que usa Finanzas para cada marca (§6.7.1)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MARCAS.map((marca) => {
            const ingresos = CATEGORIAS.ingreso[marca];
            const egresos = CATEGORIAS.egreso[marca];
            return (
              <div key={marca} className="rounded-lg border border-borde p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-texto mb-2">
                  <Tag size={14} className="text-texto-secundario" />
                  {MARCA_LABEL[marca]}
                </p>
                {ingresos.length > 0 && (
                  <p className="text-xs text-texto-secundario mb-1">
                    <span className="text-verde">Ingreso:</span> {ingresos.join(", ")}
                  </p>
                )}
                {egresos.length > 0 && (
                  <p className="text-xs text-texto-secundario">
                    <span className="text-rojo">Egreso:</span> {egresos.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <Info size={18} className="text-texto-secundario shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-texto">Centro de Operaciones JMF</p>
          <p className="text-sm text-texto-secundario mt-1">
            Gestiona Detailing, Shop y Classmotor en un solo lugar: agenda, órdenes, clientes,
            finanzas, presupuestos y recordatorios.
          </p>
        </div>
      </Card>
    </div>
  );
}
