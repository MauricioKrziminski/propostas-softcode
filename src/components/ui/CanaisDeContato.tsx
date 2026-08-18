import { CONTATO, linkEmail, linkWhatsApp } from "@/lib/contato";

/**
 * Os caminhos para falar com a SoftCode, sempre mais de um.
 *
 * O motivo é chato e real: `mailto:` não funciona no computador da maioria das
 * pessoas. Sem cliente de e-mail instalado, o link não abre o Gmail no
 * navegador e o clique não faz nada, o que transforma um convite para conversar
 * num beco sem saída. No celular ele funciona bem, porque abre o aplicativo.
 *
 * Então WhatsApp vem primeiro, com nome de gente ao lado do número, e-mail e
 * Instagram ficam ao lado. Nenhum canal é obrigatório: quem quiser mandar áudio
 * às onze da noite manda, quem preferir escrever um e-mail formal escreve.
 */
type Props = {
  /** Texto que já vai escrito na conversa do WhatsApp. */
  mensagem: string;
  /** Assunto e corpo do e-mail; sem eles, o e-mail sai limpo. */
  assunto?: string;
  /** Em capítulo escuro as bordas e o texto mudam de lado. */
  escuro?: boolean;
  className?: string;
};

export function CanaisDeContato({ mensagem, assunto, escuro, className = "" }: Props) {
  const base =
    "alvo-toque inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 " +
    "text-sm uppercase tracking-[0.12em] transition-colors duration-200 motion-reduce:transition-none";

  /* Em capítulo escuro as cores vêm dos tokens de contexto (`--ctx-*`), que a
     página define por seção. Fora deles, a paleta clara padrão. */
  const solido = escuro
    ? "bg-[var(--ctx-acento)] text-noite"
    : "bg-acento text-osso hover:bg-acento-claro";

  const contorno = escuro
    ? "border border-[var(--ctx-linha)] text-[var(--ctx-texto)] hover:border-[var(--ctx-acento)]"
    : "border border-linha text-navy hover:border-acento hover:text-acento";

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      {CONTATO.whatsapps.map((pessoa, i) => (
        <a
          key={pessoa.numero}
          href={linkWhatsApp(mensagem, pessoa.numero)}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className={`${base} ${i === 0 ? solido : contorno} whitespace-nowrap`}
        >
          WhatsApp · {pessoa.nome}
        </a>
      ))}

      <a
        href={CONTATO.instagram}
        target="_blank"
        rel="noopener noreferrer nofollow"
        referrerPolicy="no-referrer"
        className={`${base} ${contorno} whitespace-nowrap`}
      >
        Instagram
      </a>

      <a
        href={assunto ? linkEmail(assunto, mensagem) : `mailto:${CONTATO.email}`}
        className={`${base} ${contorno} whitespace-nowrap`}
      >
        E-mail
      </a>
    </div>
  );
}
