import type { NextConfig } from "next";
import { SITIOS_WEB_JMF } from "./lib/web-jmf";

const nextConfig: NextConfig = {
  // Indicador de Next.js Dev Tools (la burbuja "N · X Issues" abajo a la
  // izquierda) — solo aparece en desarrollo, nunca en producción, pero
  // se saca también acá para no verlo mientras se prueba localmente.
  // Los errores reales de compilación/runtime se siguen mostrando igual.
  devIndicators: false,

  async headers() {
    return [
      {
        // El CRM no se puede mostrar dentro de otra página (evita que lo
        // metan en un iframe para engañar clics).
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
      {
        // La agenda online sí: se embebe en la web de JMF Detailing.
        source: "/reservar/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // En desarrollo también desde localhost, para probar la web local.
            value: `frame-ancestors 'self' ${SITIOS_WEB_JMF.join(" ")}${
              process.env.NODE_ENV === "production" ? "" : " http://localhost:*"
            }`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
