import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Odometro } from "@/components/motion/Odometro";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Investimento as Dados } from "@/lib/proposta/schema";

/**
 * Capítulo NOITE. De 1 a 3 opções: cliente escolhendo QUAL fecha mais que
 * cliente decidindo SE.
 *
 * O cartão em destaque tem tratamento ESTRUTURALMENTE diferente, não só mais
 * claro: borda metálica girando, vidro, selo deslocado para fora da caixa e o
 * valor maior. Os outros dois são superfície lisa — a diferença precisa ser
 * legível de relance, sem ler uma palavra.
 *
 * O valor entra por odômetro, mas o número final vem do servidor: animação
 * nunca é pré-requisito para ler um preço.
 */
export function Investimento({ dados, numero }: { dados: Dados; numero: number }) {
  const colunas =
    dados.opcoes.length === 1
      ? "sm:grid-cols-1"
      : dados.opcoes.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <Secao
      id="investimento"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Investimento"}
      largura="ampla"
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar
          como="p"
          className="mb-14 max-w-3xl text-destaque leading-relaxed text-noite-neblina"
        >
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada className={`grid items-start gap-6 ${colunas}`}>
        {dados.opcoes.map((opcao) => (
          <ItemRevelado
            key={opcao.id}
            como="article"
            className={`cartao-investimento relative flex flex-col p-7 sm:p-9 ${
              opcao.destaque
                ? "borda-metal vidro sm:-mt-6 sm:pb-12 sm:pt-12"
                : "rounded-[var(--radius-peca)] border border-noite-linha bg-noite-elevada/40"
            }`}
          >
            {opcao.destaque && (
              <p className="tipo-mono absolute -top-3 left-7 rounded-full bg-acento-noite px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-noite">
                Recomendada
              </p>
            )}

            <h3 className="tipo-display text-secao leading-tight !text-noite-texto">
              {opcao.nome}
            </h3>
            <p className="mt-2 text-sm text-noite-neblina">{opcao.resumo}</p>

            <Odometro
              valorCentavos={opcao.valorCentavos}
              className={`mt-8 block ${
                opcao.destaque
                  ? "text-[clamp(2rem,5vw,2.75rem)] text-acento-noite"
                  : "text-[clamp(1.75rem,4vw,2.25rem)] text-noite-texto"
              }`}
            />

            {opcao.formaPagamento && (
              <p className="mt-3 text-xs leading-relaxed text-noite-neblina">
                {opcao.formaPagamento}
              </p>
            )}
            {opcao.prazo && (
              <p className="numero mt-1 text-xs text-noite-neblina">Prazo: {opcao.prazo}</p>
            )}

            <ul className="mt-7 flex-1 space-y-3 border-t border-noite-linha pt-7 text-sm">
              {opcao.itens.map((item, i) => (
                <li key={i} className="flex gap-3 text-noite-neblina">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-acento-noite" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.observacoes && dados.observacoes.length > 0 && (
        <ul className="mt-12 space-y-2 text-sm text-noite-neblina">
          {dados.observacoes.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
