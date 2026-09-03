import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicador de Next.js Dev Tools (la burbuja "N · X Issues" abajo a la
  // izquierda) — solo aparece en desarrollo, nunca en producción, pero
  // se saca también acá para no verlo mientras se prueba localmente.
  // Los errores reales de compilación/runtime se siguen mostrando igual.
  devIndicators: false,
};

export default nextConfig;
