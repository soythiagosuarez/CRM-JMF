import { createClient } from "@/lib/supabase/server";
import type { Producto } from "@/lib/types/producto";

export async function listarProductos(): Promise<Producto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error("No se pudieron cargar los productos: " + error.message);
  return data as Producto[];
}
