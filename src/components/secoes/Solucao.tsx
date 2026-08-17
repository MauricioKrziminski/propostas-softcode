import { Secao } from "@/components/ui/Secao";
import type { Solucao as Dados } from "@/lib/proposta/schema";

export function Solucao({ dados }: { dados: Dados }) {
  return (
    <Secao id="solucao" etiqueta="02" titulo={dados.titulo ?? "A solução proposta"}>
      <p className="text-lg leading-relaxed text-salvia" data-reveal>
        {dados.resumo}
      </p>

      {/* Stagger vem da posição no DOM (nth-child), não de JS. */}
      <div className="mt-12 grid gap-px overflow-hidden border border-linha sm:grid-cols-2" data-stagger>
        {dados.pilares.map((pilar) => (
          <article
            key={pilar.titulo}
            className="cartao-luz bg-fundo p-6 outline outline-linha sm:p-8"
          >
            <h3 className="tipo-display text-xl leading-tight text-osso">
              {pilar.titulo}
            </h3>
            <p className="mt-3 text-salvia">{pilar.descricao}</p>
          </article>
        ))}
      </div>
    </Secao>
  );
}
