import type { ReactNode } from "react";

import { LogoSoftCode } from "./LogoSoftCode";
import { CanaisDeContato } from "./CanaisDeContato";

/**
 * A portaria: as duas telas em que alguém chega SEM uma proposta.
 *
 * A raiz e o 404 são o mesmo problema com dois textos, então são a mesma peça.
 *
 * Ela é ESCURA, e isso não é gosto: a proposta é um documento claro, e a
 * portaria não é documento nenhum, é a porta. Escurecer separa as duas coisas
 * sem inventar uma terceira paleta, porque o navy já é o capítulo noite que a
 * proposta usa no hero e no aceite. De quebra, o cartão claro no meio do escuro
 * repete o gesto do convite: uma peça iluminada sobre fundo apagado.
 *
 * O que ela NÃO pode ter, e por isso não tem: link para proposta alguma, busca,
 * ou qualquer coisa que confirme se um endereço existe. A privacidade vem de a
 * URL ser a única chave, e uma portaria falante estragaria isso.
 */
export function Portaria({
  etiqueta,
  titulo,
  texto,
  nota,
  mensagemDeContato,
}: {
  etiqueta: string;
  titulo: string;
  texto: ReactNode;
  nota: ReactNode;
  /** Texto que já vai escrito na conversa de quem clicar no WhatsApp. */
  mensagemDeContato: string;
}) {
  return (
    <main
      /* `data-capitulo="noite"` liga os tokens de contexto que a proposta já
         usa nos capítulos escuros. É o que faz os canais de contato herdarem a
         paleta certa sem repetir cor nenhuma aqui. */
      data-capitulo="noite"
      className="relative flex min-h-[100dvh] items-center justify-center bg-noite px-5 py-14 sm:px-8"
    >
      {/* Clarão frio no alto e grão fino: profundidade sem desenhar nada. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_60%_at_50%_-10%,#16233a_0%,transparent_70%)]"
      />

      <div className="relative w-full max-w-2xl">
        <article className="rounded-[var(--radius-peca)] border border-noite-linha bg-noite-elevada px-6 py-12 text-center sm:px-12 sm:py-14">
          <LogoSoftCode className="mx-auto h-16 w-auto" prioridade escuro />

          <p className="tipo-mono mt-9 text-miudo uppercase tracking-[0.32em] text-acento-noite">
            {etiqueta}
          </p>

          <h1 className="tipo-display mx-auto mt-4 max-w-lg text-secao text-noite-texto">
            {titulo}
          </h1>

          <p className="mx-auto mt-5 max-w-md leading-relaxed text-noite-neblina">{texto}</p>

          <CanaisDeContato mensagem={mensagemDeContato} escuro className="mt-9" />

          <p className="mx-auto mt-9 max-w-md border-t border-noite-linha pt-6 text-sm leading-relaxed text-noite-neblina">
            {nota}
          </p>
        </article>

        <p className="tipo-mono mt-6 text-center text-miudo uppercase tracking-[0.24em] text-noite-neblina">
          propostas.softcodedev.com.br
        </p>
      </div>
    </main>
  );
}
