import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Entendimento as Dados } from "@/lib/proposta/schema";

/**
 * A seção mais importante da página: o problema do cliente, nas palavras dele.
 *
 * Capítulo CLARO de propósito — é a seção de leitura mais longa, e texto extenso
 * se lê melhor em fundo claro. O peso visual vem da citação, tratada como peça
 * editorial: aspa gigante em Fraunces com WONK, texto em display, filete de
 * acento. Ela é a prova de que você ouviu, então merece a escala de um título.
 */
export function Entendimento({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="entendimento"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "O que entendemos"}
      ritmo="respiro"
    >
      <ListaRevelada className="space-y-7">
        {dados.paragrafos.map((p, i) => (
          <ItemRevelado key={i}>
            <p className="text-destaque leading-relaxed text-[var(--ctx-texto)]">{p}</p>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.citacaoCliente && (
        <Revelar direcao="escala" className="mt-20 sm:mt-28">
          <figure className="relative">
            {/* A aspa fica ACIMA da citação, nunca sobreposta: em posicionamento
                absoluto ela cobria a primeira palavra no celular. */}
            <span
              aria-hidden
              className="tipo-display tipo-display-wonk block select-none text-[clamp(5rem,12vw,9rem)] leading-[0.42] !text-[var(--ctx-acento)] opacity-25"
            >
              &ldquo;
            </span>

            <blockquote className="relative mt-2 border-l-2 border-[var(--ctx-acento)] pl-6 sm:pl-10">
              <p className="tipo-display text-secao leading-[1.15]">
                {dados.citacaoCliente.texto}
              </p>
              {dados.citacaoCliente.autor && (
                <figcaption className="tipo-mono mt-6 text-miudo uppercase tracking-[0.2em] text-[var(--ctx-neblina)]">
                  {dados.citacaoCliente.autor}
                </figcaption>
              )}
            </blockquote>
          </figure>
        </Revelar>
      )}
    </Secao>
  );
}
