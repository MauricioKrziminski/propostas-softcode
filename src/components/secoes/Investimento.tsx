import { Secao } from "@/components/ui/Secao";
import { Contador } from "@/components/motion/Contador";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Investimento as Dados } from "@/lib/proposta/schema";

/**
 * De 1 a 3 opções: cliente escolhendo QUAL fecha mais que cliente decidindo SE.
 *
 * A borda de cada cartão se desenha ao entrar — quatro filetes de 1px animados
 * em `scaleX`/`scaleY` com atrasos encadeados, formando o retângulo. É por isso
 * que são elementos e não `border`: `border` não se anima com transform.
 *
 * O cartão em destaque tem tratamento estruturalmente diferente, não só mais
 * claro: superfície elevada, régua de latão de 3px no topo, selo deslocado para
 * fora da caixa e escala levemente maior no desktop.
 */
function BordaDesenhada({ destaque }: { destaque: boolean }) {
  const cor = destaque ? "bg-acento" : "bg-linha";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className={`borda-topo absolute left-0 top-0 h-px w-full ${cor}`} />
      <span className={`borda-dir absolute right-0 top-0 h-full w-px ${cor}`} />
      <span className={`borda-base absolute bottom-0 left-0 h-px w-full ${cor}`} />
      <span className={`borda-esq absolute left-0 top-0 h-full w-px ${cor}`} />
    </span>
  );
}

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
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-12 max-w-3xl text-lg leading-relaxed text-neblina">
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada className={`grid items-start gap-6 ${colunas}`}>
        {dados.opcoes.map((opcao) => (
          <ItemRevelado
            key={opcao.id}
            como="article"
            className={`cartao-investimento cartao-luz relative flex flex-col p-6 sm:p-8 ${
              opcao.destaque
                ? "bg-superficie sm:-mt-4 sm:pb-12 sm:pt-10"
                : "bg-fundo/40"
            }`}
          >
            <BordaDesenhada destaque={opcao.destaque} />

            {/* régua grossa de latão: a marca estrutural do destaque */}
            {opcao.destaque && (
              <span
                aria-hidden
                className="borda-topo absolute inset-x-0 top-0 h-[3px] origin-left bg-acento"
              />
            )}

            {opcao.destaque && (
              <p className="absolute -top-3 left-6 bg-acento px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-fundo">
                Recomendada
              </p>
            )}

            <h3 className="tipo-display text-secao leading-tight text-navy">
              {opcao.nome}
            </h3>
            <p className="mt-2 text-sm text-neblina">{opcao.resumo}</p>

            <Contador
              valorCentavos={opcao.valorCentavos}
              className={`tipo-display mt-6 block ${
                opcao.destaque ? "text-4xl text-acento" : "text-3xl text-navy"
              }`}
            />

            {opcao.formaPagamento && (
              <p className="mt-2 text-xs leading-relaxed text-neblina">
                {opcao.formaPagamento}
              </p>
            )}
            {opcao.prazo && (
              <p className="numero mt-1 text-xs text-neblina">Prazo: {opcao.prazo}</p>
            )}

            <ul className="mt-6 flex-1 space-y-2.5 border-t border-linha pt-6 text-sm">
              {opcao.itens.map((item, j) => (
                <li key={j} className="flex gap-3 text-neblina">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-acento" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.observacoes && dados.observacoes.length > 0 && (
        <ul className="mt-10 space-y-2 text-sm text-neblina">
          {dados.observacoes.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
