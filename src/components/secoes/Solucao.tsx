import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Solucao as Dados } from "@/lib/proposta/schema";

/**
 * Os pilares da solução, em cartões numerados.
 *
 * O numeral fica ATRÁS do título, em escala grande e opacidade baixa, dá peso
 * ao cartão sem competir com a leitura, e é o mesmo recurso do painel de etapa,
 * o que amarra as duas seções no mesmo vocabulário.
 *
 * A varredura de brilho no hover só existe em ponteiro fino: no touch ela nunca
 * dispararia e ocuparia GPU à toa.
 */
export function Solucao({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="solucao"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "A solução proposta"}
      largura="ampla"
    >
      <Revelar
        como="p"
        className="max-w-3xl text-destaque leading-relaxed text-[var(--ctx-texto)]"
      >
        {dados.resumo}
      </Revelar>

      <ListaRevelada className="mt-16 grid gap-5 sm:grid-cols-2">
        {dados.pilares.map((pilar, i) => (
          <ItemRevelado
            key={pilar.titulo}
            como="article"
            className="cartao-luz varredura relative overflow-hidden rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] p-7 transition-colors duration-300 hover:border-[var(--ctx-acento)] motion-reduce:transition-none sm:p-9"
          >
            <span
              aria-hidden
              className="tipo-display pointer-events-none absolute -right-2 -top-6 select-none text-[7rem] leading-none !text-[var(--ctx-acento)] opacity-[0.07]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <h3 className="tipo-display relative text-[clamp(1.25rem,2.6vw,1.6rem)] leading-tight">
              {pilar.titulo}
            </h3>
            <p className="relative mt-3 leading-relaxed text-[var(--ctx-neblina)]">
              {pilar.descricao}
            </p>
          </ItemRevelado>
        ))}
      </ListaRevelada>
    </Secao>
  );
}
