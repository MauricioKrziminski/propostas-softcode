import { Secao } from "@/components/ui/Secao";
import type { Entendimento as Dados } from "@/lib/proposta/schema";

/**
 * A seção mais importante da página: o problema do cliente, nas palavras dele.
 *
 * Movimento deliberadamente discreto aqui — um reveal curto e nada mais. Se
 * esta seção chamar atenção para a animação em vez do texto, ela falhou.
 */
export function Entendimento({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="entendimento"
      etiqueta="01"
      titulo={dados.titulo ?? "O que entendemos"}
      ritmo="respiro"
    >
      <div className="space-y-6" data-stagger>
        {dados.paragrafos.map((p, i) => (
          <p
            key={i}
            className="text-lg leading-relaxed text-neblina"
            style={{ ["--i" as string]: i }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* A citação é o coração da seção: entra em destaque, com a aspa em
          latão em escala grande servindo de âncora visual. */}
      {dados.citacaoCliente && (
        <figure className="relative mt-16 sm:mt-20" data-reveal>
          <span
            aria-hidden
            className="aspas-grande tipo-display pointer-events-none absolute -left-1 -top-10 origin-bottom-left select-none text-[8rem] leading-none text-acento/25 sm:-left-6 sm:text-[12rem]"
          >
            &ldquo;
          </span>
          <blockquote className="relative border-l-2 border-acento pl-6 sm:pl-10">
            <p className="tipo-display text-secao leading-tight text-osso">
              {dados.citacaoCliente.texto}
            </p>
            {dados.citacaoCliente.autor && (
              <figcaption className="mt-5 text-sm text-neblina">
                — {dados.citacaoCliente.autor}
              </figcaption>
            )}
          </blockquote>
        </figure>
      )}
    </Secao>
  );
}
