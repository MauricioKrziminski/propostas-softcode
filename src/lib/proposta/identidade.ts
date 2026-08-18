import { randomBytes } from "node:crypto";

/**
 * Slug e token: as duas metades da URL que autoriza a proposta.
 *
 * O token É a autorização. Toda a privacidade da proposta depende de ele ser
 * impossível de adivinhar, então: sorteio criptográfico, nunca sequencial, nunca
 * derivado do nome do cliente ou da data. Dez caracteres num alfabeto de 62 dão
 * cerca de 8 x 10^17 combinações; com o número de propostas que a SoftCode
 * envia, a chance de alguém acertar uma por tentativa é irrelevante.
 *
 * O alfabeto é só letras e números, sem `-` e `_` do nanoid original. Motivo
 * prático: a URL é `{slug}-{token}` e o slug tem hífen. Manter o token livre de
 * hífen deixa a leitura da URL óbvia para um humano depurando um link.
 */
const ALFABETO = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const TAMANHO_TOKEN = 10;

export function gerarToken(): string {
  /* Rejeição por módulo: 256 não é múltiplo de 62, então usar `% 62` direto
     daria mais chance para os primeiros caracteres do alfabeto. O teto abaixo
     descarta os bytes que cairiam no pedaço incompleto. */
  const teto = Math.floor(256 / ALFABETO.length) * ALFABETO.length;
  let saida = "";

  while (saida.length < TAMANHO_TOKEN) {
    for (const byte of randomBytes(TAMANHO_TOKEN * 2)) {
      if (byte >= teto) continue;
      saida += ALFABETO[byte % ALFABETO.length];
      if (saida.length === TAMANHO_TOKEN) break;
    }
  }
  return saida;
}

/** "Barba Log Transportes" vira "barba-log-transportes". */
export function gerarSlug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");

  return base.length >= 2 ? base : `proposta-${Date.now().toString(36)}`;
}
