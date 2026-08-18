/**
 * Dados de contato da SoftCode.
 *
 * O e-mail veio do documento de handoff da Barba Log, onde consta como contato
 * oficial da SoftCode.
 *
 * ⚠️ PENDÊNCIA: o WhatsApp ainda é placeholder. Ele é o canal do CTA de proposta
 * expirada, precisa do número real antes do primeiro envio.
 */
export const CONTATO = {
  email: "softcodedv@gmail.com",
  /** E-mail para pedidos de acesso/exclusão de dados (LGPD). */
  emailDados: "softcodedv@gmail.com",
  /** Formato internacional, só dígitos, usado no link wa.me. */
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
