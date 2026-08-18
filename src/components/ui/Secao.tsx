import type { ReactNode } from "react";
import { TituloRevelado } from "./TituloRevelado";
import { Revelar } from "@/components/motion/Revelar";

/**
 * Casca comum de toda seção.
 *
 * O título NÃO é mais sticky: uma barra grudada no topo comia a viewport do
 * celular e disputava atenção com o conteúdo. O título entra, é lido, e sai
 * junto com a seção.
 *
 * O fundo também não é definido aqui, quem alterna os tons e coloca a corda
 * entre um e outro é a página.
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
        {(titulo || etiqueta) && (
          <header className="mb-10 sm:mb-14">
            {etiqueta && (
              <Revelar direcao="esquerda" como="p">
                <span className="tipo-mono block text-miudo uppercase tracking-[0.32em] text-[var(--ctx-acento)]">
                  {etiqueta}
                </span>
              </Revelar>
            )}
            {titulo && (
              <TituloRevelado
                texto={titulo}
                className="tipo-display mt-4 text-titulo"
              />
            )}
            <Revelar direcao="esquerda" atraso={0.15}>
              <span aria-hidden className="mt-7 block h-px w-24 bg-[var(--ctx-acento)]" />
            </Revelar>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
