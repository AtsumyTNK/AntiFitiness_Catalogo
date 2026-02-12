import type { NextConfig } from "next";

/**
 * next/image exige que domínios externos estejam liberados aqui.
 * Sem isso, qualquer imagem remota (Mercado Livre, Tray/Tcdn etc) quebra o runtime.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Mercado Livre
      { protocol: "https", hostname: "**" },

      /* Tcdn/Tray (apareceu no seu erro)
      { protocol: "https", hostname: "images.tcdn.com.br" }, */
    ],
  },
};

export default nextConfig;