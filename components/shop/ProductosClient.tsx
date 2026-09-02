"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ShoppingCart, AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductoForm } from "./ProductoForm";
import { VentaForm } from "./VentaForm";
import { crearProducto, actualizarProducto, eliminarProducto } from "@/app/(app)/shop/actions";
import { formatARS } from "@/lib/format";
import type { Producto } from "@/lib/types/producto";

export function ProductosClient({ productos }: { productos: Producto[] }) {
  const [creando, setCreando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [vendiendoId, setVendiendoId] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo);

  const borrar = (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? No se puede deshacer.`)) return;
    setErrorEliminar(null);
    startTransition(async () => {
      const resultado = await eliminarProducto(p.id);
      if (resultado.error) setErrorEliminar(resultado.error);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/brands/shop.png" alt="" width={44} height={44} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-texto">Gestión de Shop</h1>
            <p className="text-sm text-texto-secundario mt-1">
              Productos, stock y precios. Alerta de recompra cuando el stock llega al mínimo.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!creando && (
            <Button onClick={() => setCreando(true)}>
              <Plus size={16} />
              Nuevo producto
            </Button>
          )}
        </div>
      </div>

      {stockBajo.length > 0 && (
        <Card className="flex items-center gap-3 border-rojo/30 bg-rojo/5">
          <AlertTriangle size={18} className="text-rojo shrink-0" />
          <p className="text-sm text-texto">
            <span className="font-medium text-rojo">
              {stockBajo.length} {stockBajo.length === 1 ? "producto" : "productos"}
            </span>{" "}
            con stock en el mínimo o por debajo: {stockBajo.map((p) => p.nombre).join(", ")}.
          </p>
        </Card>
      )}

      {creando && (
        <Card>
          <CardHeader title="Nuevo producto" />
          <ProductoForm
            accion={crearProducto}
            onCancelar={() => setCreando(false)}
            onGuardado={() => setCreando(false)}
          />
        </Card>
      )}

      {errorEliminar && (
        <p className="text-sm text-rojo" role="alert">
          {errorEliminar}
        </p>
      )}

      {productos.length === 0 && !creando ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-texto">Todavía no hay productos cargados.</p>
          <p className="text-sm text-texto-secundario max-w-sm">
            Usá &quot;Nuevo producto&quot; para cargar el primero del catálogo real.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {productos.map((p) =>
            editandoId === p.id ? (
              <Card key={p.id}>
                <CardHeader title={`Editar: ${p.nombre}`} />
                <ProductoForm
                  producto={p}
                  accion={actualizarProducto.bind(null, p.id)}
                  onCancelar={() => setEditandoId(null)}
                  onGuardado={() => setEditandoId(null)}
                />
              </Card>
            ) : (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-texto font-medium truncate">{p.nombre}</p>
                    <p className="text-xs text-texto-secundario mt-0.5">
                      Stock: {p.stock_actual}
                      {p.stock_actual <= p.stock_minimo && (
                        <Badge tono="negativo">Recomprar</Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditandoId(p.id)}
                      className="text-texto-secundario hover:text-texto"
                      aria-label="Editar producto"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => borrar(p)}
                      disabled={isPending}
                      className="text-texto-secundario hover:text-rojo disabled:opacity-50"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-texto-secundario mt-3">
                  <span>Venta: {p.precio_venta ? formatARS(p.precio_venta) : "—"}</span>
                  <span>Costo: {p.precio_costo ? formatARS(p.precio_costo) : "—"}</span>
                </div>

                {vendiendoId === p.id ? (
                  <div className="mt-3 pt-3 border-t border-borde">
                    <VentaForm
                      producto={p}
                      onCancelar={() => setVendiendoId(null)}
                      onGuardado={() => setVendiendoId(null)}
                    />
                  </div>
                ) : (
                  <Button
                    variante="secundario"
                    disabled={p.stock_actual === 0}
                    onClick={() => setVendiendoId(p.id)}
                    className="w-full mt-3"
                  >
                    <ShoppingCart size={14} />
                    {p.stock_actual === 0 ? "Sin stock" : "Vender"}
                  </Button>
                )}
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
