import { Secao } from "@/components/ui/Secao";
import { formatarValor, rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import { valoresDasParcelas, type Pagamento as Dados } from "@/lib/proposta/schema";

/**
 * Como o pagamento funciona.
 *
 * Os valores em reais NÃO estão gravados na proposta: eles são calculados aqui,
 * a partir do total da opção recomendada. É a diferença entre uma tabela que
 * envelhece e uma que não pode envelhecer. No PDF antigo, feito à mão, bastava
 * um reajuste para a tabela de pagamento continuar mostrando o preço velho.
 *
 * Em tela estreita a tabela vira lista: tabela de três colunas em 390px ou
 * estoura a largura ou fica ilegível, e este bloco é justamente o que o cliente
 * relê antes de decidir.
 */
export function Pagamento({
  dados,
  numero,
  totalCentavos,
  nomeDaOpcao,
}: {
  dados: Dados;
  numero: number;
  totalCentavos?: number;
  nomeDaOpcao?: string;
}) {
  const percentuais = dados.parcelas.map((p) => p.percentual);
  const valores =
    totalCentavos !== undefined ? valoresDasParcelas(totalCentavos, percentuais) : undefined;

  return (
    <Secao
      id="pagamento"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Como o pagamento funciona"}
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-10 max-w-3xl text-destaque leading-relaxed text-[var(--ctx-texto)]">
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada como="ul" className="border-t border-[var(--ctx-linha)]">
        {dados.parcelas.map((parcela, i) => (
          <ItemRevelado
            key={i}
            como="li"
            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[var(--ctx-linha)] py-5"
          >
            <span className="tipo-mono shrink-0 text-destaque text-[var(--ctx-acento)]">
              {parcela.percentual}%
            </span>
            <span className="min-w-0 flex-1 text-[var(--ctx-titulo)]">
              {parcela.rotulo}
              {parcela.quando && (
                <span className="block text-sm text-[var(--ctx-neblina)]">{parcela.quando}</span>
              )}
            </span>
            {valores && (
              <span className="tipo-mono shrink-0 text-destaque text-[var(--ctx-titulo)]">
                {formatarValor(valores[i])}
              </span>
            )}
          </ItemRevelado>
        ))}

        {valores && totalCentavos !== undefined && (
          <ItemRevelado
            como="li"
            className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-5"
          >
            <span className="tipo-mono shrink-0 text-destaque text-[var(--ctx-neblina)]">100%</span>
            <span className="min-w-0 flex-1 text-[var(--ctx-neblina)]">
              Total{nomeDaOpcao ? ` (${nomeDaOpcao})` : ""}
            </span>
            <span className="tipo-mono shrink-0 text-destaque text-[var(--ctx-titulo)]">
              {formatarValor(totalCentavos)}
            </span>
          </ItemRevelado>
        )}
      </ListaRevelada>

      {dados.nota && (
        <Revelar como="p" className="mt-6 text-sm leading-relaxed text-[var(--ctx-neblina)]">
          {dados.nota}
        </Revelar>
      )}

      {dados.cancelamento && (
        <Revelar className="mt-10 rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] p-6 sm:p-7">
          <h3 className="tipo-display text-[clamp(1.125rem,2.4vw,1.5rem)] text-[var(--ctx-titulo)]">
            {dados.cancelamento.titulo ?? "Se o projeto precisar ser cancelado"}
          </h3>
          <p className="mt-3 leading-relaxed text-[var(--ctx-neblina)]">
            {dados.cancelamento.texto}
          </p>
        </Revelar>
      )}
    </Secao>
  );
}
