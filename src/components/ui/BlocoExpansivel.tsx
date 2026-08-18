import type { ReactNode } from "react";

/**
 * `<details>` nativo, de propósito: acessível por teclado sem uma linha de JS,
 * anunciado corretamente por leitor de tela e, o que mais importa aqui,
 * imprimível. O `print.css` e o listener `beforeprint` abrem todos antes do PDF.
 *
 * Vira um CARTÃO que gruda no topo e recua conforme o próximo chega: a pilha
 * comunica "o escopo é uma lista finita, dá para ver o fim". O `top` cresce com
 * o índice para os cartões empilharem em escadinha em vez de um cobrir o outro.
 *
 * O sticky é do CARTÃO, não do título da seção, título de seção sticky é
 * proibido no projeto, e o validador falha se voltar.
 */
export function BlocoExpansivel({
  titulo,
  resumo,
  indice,
  ordem = 0,
  children,
}: {
  titulo: string;
  resumo?: string;
  indice: number;
  ordem?: number;
  children: ReactNode;
}) {
  return (
    <details
      className="group sticky overflow-hidden rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] shadow-[0_10px_40px_-32px_rgb(13_27_42/0.5)]"
      style={{
        top: `calc(var(--altura-cabecalho) + ${ordem * 0.75}rem)`,
        zIndex: ordem + 1,
      }}
    >
      <summary className="alvo-toque flex cursor-pointer list-none items-start gap-4 p-6 pr-4 transition-colors duration-200 hover:bg-[var(--ctx-elevado)] motion-reduce:transition-none [&::-webkit-details-marker]:hidden sm:p-8">
        <span className="tipo-mono mt-1 shrink-0 text-miudo text-[var(--ctx-acento)]">
          {String(indice).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span className="tipo-display block text-[clamp(1.125rem,2.2vw,1.375rem)] leading-snug">
            {titulo}
          </span>
          {resumo && (
            <span className="mt-1.5 block text-sm text-[var(--ctx-neblina)]">
              {resumo}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="mt-1 shrink-0 text-[var(--ctx-acento)] transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </summary>
      <div className="px-6 pb-8 pl-16 pr-6 text-[var(--ctx-neblina)] sm:px-8 sm:pl-20">
        {children}
      </div>
    </details>
  );
}
