import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Segunda camada de anti-indexação, junto com app/robots.ts.
            // `nosnippet`/`noimageindex` ficam FORA de propósito: são as
            // diretivas que suprimem miniatura e trecho, e matariam o card
            // do WhatsApp que o opengraph-image existe para gerar.
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
