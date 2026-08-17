import { Secao } from "@/components/ui/Secao";
import { formatarValor } from "@/lib/proposta/formatar";
import type { Investimento as Dados } from "@/lib/proposta/schema";

/**
 * De 1 a 3 opções lado a lado: cliente escolhendo QUAL fecha mais que cliente
 * decidindo SE. No celular viram cartões empilhados, com o destaque primeiro na
 * ordem visual — sem depender de hover para nada.
 */
export function Investimento({ dados }: { dados: Dados }) {
  const colunas =
    dados.opcoes.length === 1
      ? "sm:grid-cols-1"
      : dados.opcoes.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <Secao
      id="investimento"
      etiqueta="06"
      titulo={dados.titulo ?? "Investimento"}
      largura="ampla"
    >
      {dados.introducao && (
        <p className="mb-10 max-w-3xl text-lg leading-relaxed text-salvia" data-reveal>
          {dados.introducao}
        </p>
      )}

      <div className={`grid gap-6 ${colunas}`} data-stagger>
        {dados.opcoes.map((opcao) => (
          <article
            key={opcao.id}
            className={`cartao-investimento cartao-luz flex flex-col border p-6 sm:p-8 ${
              opcao.destaque
                ? "border-latao bg-superficie"
                : "border-linha bg-fundo"
            }`}
          >
            {opcao.destaque && (
              <p className="mb-4 text-xs uppercase tracking-[0.2em] text-latao">
                Recomendada
              </p>
            )}

            <h3 className="tipo-display text-secao leading-tight text-osso">
              {opcao.nome}
            </h3>
            <p className="mt-2 text-sm text-salvia">{opcao.resumo}</p>

            <p className="numero tipo-display mt-6 text-3xl text-osso">
              {formatarValor(opcao.valorCentavos)}
            </p>
            {opcao.formaPagamento && (
              <p className="mt-2 text-xs leading-relaxed text-salvia">
                {opcao.formaPagamento}
              </p>
            )}
            {opcao.prazo && (
              <p className="numero mt-1 text-xs text-salvia">Prazo: {opcao.prazo}</p>
            )}

            <ul className="mt-6 flex-1 space-y-2.5 border-t border-linha pt-6 text-sm">
              {opcao.itens.map((item, i) => (
                <li key={i} className="flex gap-3 text-salvia">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-latao" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {dados.observacoes && dados.observacoes.length > 0 && (
        <ul className="mt-8 space-y-2 text-sm text-salvia" data-reveal>
          {dados.observacoes.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
