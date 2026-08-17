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
    <Secao id="entendimento" etiqueta="01" titulo={dados.titulo ?? "O que entendemos"}>
      <div className="space-y-6" data-stagger>
        {dados.paragrafos.map((p, i) => (
          <p key={i} className="text-lg leading-relaxed text-salvia">
            {p}
          </p>
        ))}
      </div>

      {dados.citacaoCliente && (
        <figure className="mt-12 border-l-2 border-latao pl-6 sm:pl-8" data-reveal>
          <blockquote className="tipo-display text-secao leading-tight text-osso">
            “{dados.citacaoCliente.texto}”
          </blockquote>
          {dados.citacaoCliente.autor && (
            <figcaption className="mt-4 text-sm text-salvia">
              — {dados.citacaoCliente.autor}
            </figcaption>
          )}
        </figure>
      )}
    </Secao>
  );
}
