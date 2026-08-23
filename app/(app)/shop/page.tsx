import { listarProductos } from "@/lib/data/productos";
import { ProductosClient } from "@/components/shop/ProductosClient";

export default async function ShopPage() {
  const productos = await listarProductos();
  return <ProductosClient productos={productos} />;
}
