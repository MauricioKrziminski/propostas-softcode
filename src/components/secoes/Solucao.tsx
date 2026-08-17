import { Secao } from "@/components/ui/Secao";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Solucao as Dados } from "@/lib/proposta/schema";

export function Solucao({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="solucao"
      etiqueta="02"
      titulo={dados.titulo ?? "A solução proposta"}
    >
      <Revelar como="p" className="text-lg leading-relaxed text-neblina">
        {dados.resumo}
      </Revelar>

      {/* Stagger conduzido por --i no range da timeline, não por JS. */}
      <ListaRevelada className="mt-12 grid gap-px overflow-hidden border border-linha sm:grid-cols-2">
        {dados.pilares.map((pilar) => (
          <ItemRevelado
            key={pilar.titulo}
            como="article"
            className="cartao-luz bg-fundo/60 p-6 outline outline-linha sm:p-8"
          >
            <h3 className="tipo-display text-xl leading-tight text-navy">
              {pilar.titulo}
            </h3>
            <p className="mt-3 text-neblina">{pilar.descricao}</p>
          </ItemRevelado>
        ))}
      </ListaRevelada>
    </Secao>
  );
}
