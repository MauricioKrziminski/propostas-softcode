import type { ReactNode } from "react";
import { TituloRevelado } from "./TituloRevelado";

/**
 * Casca comum de toda seção. Centraliza três coisas que dão ritmo à página:
 *
 *   · `ritmo` — espaçamento vertical variado. Seção densa respira menos, seção
 *     de respiro respira mais. É ritmo, não grid uniforme;
 *   · `superficie` — alternância par/ímpar, com as bordas resolvidas por
 *     gradiente (`.veu-superficie`), nunca por linha dura;
 *   · o título **sticky** enquanto a seção está em tela, empurrado para fora
 *     quando a próxima chega — o sticky é limitado pela própria <section>.
 *
 * O filete horizontal se desenha da esquerda para a direita ao entrar na
 * viewport (scaleX + transform-origin: left).
 */
export function Secao({
  id,
  titulo,
  etiqueta,
  children,
  largura = "leitura",
  ritmo = "normal",
  superficie = false,
}: {
  id: string;
  titulo?: string;
  etiqueta?: string;
  children: ReactNode;
  largura?: "leitura" | "ampla";
  ritmo?: "denso" | "normal" | "respiro";
  superficie?: boolean;
}) {
  const espaco = {
    denso: "py-denso",
    normal: "py-normal",
    respiro: "py-respiro",
  }[ritmo];

  return (
    <section
      id={id}
      className={`${superficie ? "veu-superficie " : ""}${espaco}`}
    >
      <div
        className={`mx-auto w-full px-6 sm:px-8 ${
          largura === "leitura" ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {/* O texto do corpo passa POR BAIXO do bloco abaixo. Por isso ele é
            opaco no topo e some por gradiente na base: o conteúdo se dissolve
            ao entrar embaixo, em vez de aparecer borrado atrás de um véu — e
            sem a linha dura que um fundo chapado criaria. */}
        {(titulo || etiqueta) && (
          <header
            data-sticky
            className="sticky top-[var(--altura-cabecalho)] z-30 -mx-6 mb-6 px-6 pb-5 pt-4 sm:-mx-8 sm:mb-10 sm:px-8"
          >
            {/* Fundo opaco cobrindo exatamente a caixa do título, e a faixa de
                dissolução logo ABAIXO dela — assim o fade nunca cai em cima do
                filete, independentemente de quantas linhas o título tiver. */}
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-fundo"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-full -z-10 h-12 bg-gradient-to-b from-fundo to-transparent"
            />
            {etiqueta && (
              <p className="numero mb-3 text-xs uppercase tracking-[0.2em] text-latao">
                {etiqueta}
              </p>
            )}
            {titulo && (
              <TituloRevelado texto={titulo} className="tipo-display text-titulo" />
            )}
            <div
              aria-hidden
              className="filete-secao mt-4 h-px w-full origin-left bg-linha"
            >
              <div className="h-full w-16 bg-latao" />
            </div>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
