import type { ReactNode } from "react";
import { TituloRevelado } from "./TituloRevelado";

/**
 * Casca comum de toda seção.
 *
 * O fundo da seção NÃO é definido aqui: quem alterna os tons e coloca o divisor
 * de ondas entre um e outro é a página. O que chega até aqui é a variável
 * `--tom`, usada pelo fundo opaco do título sticky — assim ele acompanha a cor
 * da seção em que está, sem o componente precisar saber qual é.
 */
export function Secao({
  id,
  titulo,
  etiqueta,
  children,
  largura = "leitura",
  ritmo = "normal",
}: {
  id: string;
  titulo?: string;
  etiqueta?: string;
  children: ReactNode;
  largura?: "leitura" | "ampla";
  ritmo?: "denso" | "normal" | "respiro";
}) {
  const espaco = { denso: "py-denso", normal: "py-normal", respiro: "py-respiro" }[
    ritmo
  ];

  return (
    <section id={id} className={espaco}>
      <div
        className={`mx-auto w-full px-6 sm:px-8 ${
          largura === "leitura" ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {/* O texto do corpo passa POR BAIXO do bloco abaixo. Por isso ele é
            opaco no topo e some por gradiente na base: o conteúdo se dissolve
            ao entrar embaixo, sem a linha dura que um fundo chapado criaria. */}
        {(titulo || etiqueta) && (
          <header
            data-sticky
            className="sticky top-[var(--altura-cabecalho)] z-30 -mx-6 mb-8 px-6 pb-5 pt-4 sm:-mx-8 sm:mb-12 sm:px-8"
          >
            <span
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{ backgroundColor: "var(--tom, var(--color-fundo))" }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-full -z-10 h-12"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, var(--tom, var(--color-fundo)), transparent)",
              }}
            />
            {etiqueta && (
              <p className="numero mb-3 text-xs uppercase tracking-[0.28em] text-acento">
                {etiqueta}
              </p>
            )}
            {titulo && (
              <TituloRevelado texto={titulo} className="tipo-display text-titulo" />
            )}
            <div
              aria-hidden
              className="filete-secao mt-5 h-px w-full origin-left bg-linha"
            >
              <div className="h-full w-20 bg-acento" />
            </div>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
