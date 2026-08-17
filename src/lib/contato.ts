/**
 * Dados de contato da SoftCode.
 *
 * ⚠️ PENDÊNCIA (itens 9 e 5 dos riscos do plano): os valores abaixo são
 * provisórios. Precisam ser confirmados antes da primeira proposta enviada de
 * verdade — o e-mail de LGPD aparece no rodapé de toda proposta, e o WhatsApp é
 * o canal do CTA de proposta expirada.
 */
export const CONTATO = {
  email: "contato@softcodedev.com.br",
  /** E-mail para pedidos de acesso/exclusão de dados (LGPD). */
  emailDados: "contato@softcodedev.com.br",
  /** Formato internacional, só dígitos — usado no link wa.me. */
  whatsapp: "5500000000000",
  site: "https://softcodedev.com.br",
} as const;

export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(assunto: string, corpo: string): string {
  return `mailto:${CONTATO.email}?subject=${encodeURIComponent(
    assunto,
  )}&body=${encodeURIComponent(corpo)}`;
}
