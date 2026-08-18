import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Suporte as Dados } from "@/lib/proposta/schema";

/**
 * O que acontece DEPOIS da entrega.
 *
 * Vale como argumento de venda porque é a pergunta que todo cliente faz e quase
 * nenhuma proposta responde: "e se der problema depois?". Por isso os itens são
 * afirmativos e a ressalva do fim do período vem junto, no mesmo bloco: dizer só
 * a parte boa é o que gera a discussão do terceiro mês.
 */
export function Suporte({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="suporte"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Suporte após a entrega"}
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-10 max-w-3xl text-destaque leading-relaxed text-[var(--ctx-texto)]">
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada como="ul" className="grid gap-3 sm:grid-cols-2">
        {dados.itens.map((item, i) => (
          <ItemRevelado
            key={i}
            como="li"
            className="flex items-start gap-4 rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] p-5"
          >
            <span
              aria-hidden
              className="tipo-mono mt-0.5 shrink-0 text-miudo text-[var(--ctx-acento)]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[var(--ctx-titulo)]">{item}</span>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.nota && (
        <Revelar
          como="p"
          className="mt-10 border-t border-[var(--ctx-linha)] pt-6 text-sm leading-relaxed text-[var(--ctx-neblina)]"
        >
          {dados.nota}
        </Revelar>
      )}
    </Secao>
  );
}
