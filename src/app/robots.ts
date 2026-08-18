import type { MetadataRoute } from "next";
import { CRAWLERS_DE_PREVIEW } from "@/lib/crawlers";

/**
 * `Disallow: /` para todo mundo, não existe nada aqui para ser indexado, e a
 * privacidade das propostas depende de nenhuma URL virar pública.
 *
 * A exceção é deliberada: os crawlers da Meta e afins RESPEITAM robots.txt, e
 * são eles que montam o card do WhatsApp. Um `Disallow: /` cego mataria a
 * primeira impressão da proposta, o card que o cliente vê antes de abrir o link.
 *
 * Isso não abre a proposta para busca: nenhum deles indexa conteúdo, não existe
 * rota de listagem, e a URL continua impossível de adivinhar.
 * A mesma lista é usada pelo tracking (Fase 2) para IGNORAR estes acessos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: "/" },
      ...CRAWLERS_DE_PREVIEW.map((agente) => ({
        userAgent: agente,
        allow: "/",
      })),
    ],
  };
}
