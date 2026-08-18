/**
 * Os canais de contato da SoftCode.
 *
 * WhatsApp e Instagram existem aqui por uma razão prática, não por completismo:
 * `mailto:` é inútil no computador. A maior parte das pessoas não tem cliente de
 * e-mail instalado, o link não abre o Gmail no navegador, e o clique simplesmente
 * não faz nada. No celular ele funciona, porque abre o aplicativo. Então o
 * e-mail continua sendo uma opção, e nunca a única.
 *
 * A ordem dos números importa: o primeiro é o que recebe quando o contexto não
 * diz de quem é a conversa.
 */
export const CONTATO = {
  email: "softcodedv@gmail.com",
  /** E-mail para pedidos de acesso/exclusão de dados (LGPD). */
  emailDados: "softcodedv@gmail.com",

  /** Formato internacional, só dígitos, do jeito que o `wa.me` espera. */
  whatsapps: [
    { nome: "Maurício", numero: "5551992553295" },
    { nome: "Gabriel", numero: "5535998744200" },
  ],

  instagram: "https://www.instagram.com/softcode.dv/",
  site: "https://softcodedev.com.br",
} as const;

export function linkWhatsApp(
  mensagem: string,
  numero: string = CONTATO.whatsapps[0].numero,
): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(assunto: string, corpo: string): string {
  return `mailto:${CONTATO.email}?subject=${encodeURIComponent(
    assunto,
  )}&body=${encodeURIComponent(corpo)}`;
}
