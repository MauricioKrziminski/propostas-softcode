/**
 * Lista única de crawlers de preview de link. Um lugar só, dois consumidores
 * com objetivos opostos:
 *
 *   - `app/robots.ts` LIBERA estes agentes, senão o card do WhatsApp não é
 *     gerado (os crawlers da Meta respeitam robots.txt, e a regra geral é
 *     `Disallow: /`);
 *   - o tracking da Fase 2 IGNORA estes mesmos agentes, senão colar o link no
 *     WhatsApp já marcaria a proposta como visualizada e dispararia o e-mail de
 *     "o cliente abriu" antes de o cliente abrir.
 *
 * A página sempre renderiza normalmente para eles — o card precisa do HTML e do
 * OG image. O que muda é apenas se o acesso vira evento no banco.
 */

/** Agentes que montam preview de link e devem enxergar a página. */
export const CRAWLERS_DE_PREVIEW = [
  "facebookexternalhit",
  "WhatsApp",
  "Telegram",
  "TelegramBot",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "Discordbot",
  "Twitterbot",
  "LinkedInBot",
] as const;

/** Padrão amplo para qualquer outro automatismo que não seja leitura humana. */
const PADRAO_AUTOMATIZADO = /bot|crawler|spider|preview|scraper|fetcher|headless|curl|wget|python-requests|axios|node-fetch|monitor/i;

const PADRAO_PREVIEW = new RegExp(
  CRAWLERS_DE_PREVIEW.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

export function ehCrawlerDePreview(userAgent: string | null | undefined): boolean {
  return !!userAgent && PADRAO_PREVIEW.test(userAgent);
}

/**
 * Cabeçalhos relevantes para decidir se um acesso conta como leitura humana.
 * Recebe um objeto simples para não acoplar este módulo ao `Headers` do Next —
 * assim ele é testável sem subir servidor.
 */
export type CabecalhosDeAcesso = {
  userAgent?: string | null;
  purpose?: string | null;
  secPurpose?: string | null;
  xPurpose?: string | null;
};

/** É prefetch/prerender do navegador ou de um expansor de link? */
export function ehPrefetch({
  purpose,
  secPurpose,
  xPurpose,
}: CabecalhosDeAcesso): boolean {
  const valores = [purpose, secPurpose, xPurpose].filter(Boolean).join(" ").toLowerCase();
  return /prefetch|prerender|preview/.test(valores);
}

/**
 * Regra final do tracking (usada na Fase 2). Fora dela, nada é gravado:
 * sem linha em `proposta_visualizacoes`, sem incremento de contador, sem e-mail.
 */
export function contaComoVisualizacaoHumana(c: CabecalhosDeAcesso): boolean {
  const ua = c.userAgent?.trim();
  if (!ua) return false; // sem user-agent não é navegador de gente
  if (ehPrefetch(c)) return false;
  if (ehCrawlerDePreview(ua)) return false;
  if (PADRAO_AUTOMATIZADO.test(ua)) return false;
  return true;
}
