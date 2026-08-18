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
          /**
           * `SAMEORIGIN`, não `DENY`, e a diferença tem uma razão concreta: a
           * prévia do painel mostra a proposta real dentro de um `<iframe>`, e
           * `DENY` recusa até o próprio site. A proteção que importa continua
           * de pé, porque o que ela evita é OUTRO domínio emoldurar a página
           * para enganar quem clica.
           *
           * `frame-ancestors 'self'` diz a mesma coisa pela via moderna: quando
           * os dois existem, o navegador obedece ao CSP e ignora o cabeçalho
           * antigo, que segue aqui só para navegador velho.
           */
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
