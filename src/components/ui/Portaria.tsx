import type { ReactNode } from "react";

import { LogoSoftCode } from "./LogoSoftCode";
import { CONTATO } from "@/lib/contato";

/**
 * A portaria: as duas telas em que alguém chega SEM uma proposta.
 *
 * A raiz e o 404 são o mesmo problema com dois textos: alguém tem um endereço
 * que não abre uma proposta. Antes eram dois blocos de texto soltos no meio da
 * tela; agora são uma peça só, no vocabulário da proposta (papel claro, título
 * em Fraunces, etiqueta em mono), e centrada de verdade.
 *
 * O que ela NÃO pode ter, e por isso não tem: link para proposta alguma, busca,
 * ou qualquer coisa que confirme se um endereço existe. A privacidade aqui vem
 * de a URL ser a única chave, e uma portaria falante estragaria isso.
 */
export function Portaria({
  etiqueta,
  titulo,
  texto,
  nota,
  acoes,
}: {
  etiqueta: string;
  titulo: string;
  texto: ReactNode;
  nota: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-14 sm:px-8">
      {/* Clarão frio atrás do cartão. Dá profundidade sem desenhar nada, e é o
          mesmo gesto do fundo do painel, na versão clara. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,var(--color-superficie)_0%,var(--color-fundo)_65%)]"
      />

      <div className="relative w-full max-w-xl">
        <article className="rounded-[var(--radius-peca)] border border-linha bg-fundo px-6 py-12 text-center sm:px-12 sm:py-14">
          <LogoSoftCode className="mx-auto h-16 w-auto" prioridade />

          <p className="tipo-mono mt-9 text-miudo uppercase tracking-[0.32em] text-acento">
            {etiqueta}
          </p>

          <h1 className="tipo-display mx-auto mt-4 max-w-md text-secao text-navy">
            {titulo}
          </h1>

          <p className="mx-auto mt-5 max-w-md leading-relaxed text-neblina">{texto}</p>

          {acoes && (
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {acoes}
            </div>
          )}

          <p className="mx-auto mt-9 max-w-md border-t border-linha pt-6 text-sm leading-relaxed text-neblina">
            {nota}
          </p>
        </article>

        <p className="tipo-mono mt-6 text-center text-miudo uppercase tracking-[0.24em] text-neblina">
          propostas.softcodedev.com.br
        </p>
      </div>
    </main>
  );
}

/** O e-mail, escrito do mesmo jeito nas duas telas. */
export function LinkDeEmail() {
  return (
    <a
      href={`mailto:${CONTATO.email}`}
      className="text-acento underline underline-offset-4"
    >
      {CONTATO.email}
    </a>
  );
}
