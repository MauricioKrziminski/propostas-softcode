import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Responsabilidades as Dados } from "@/lib/proposta/schema";

/**
 * "O que precisamos de você" — reaproveitada dos orçamentos em PDF que a
 * SoftCode já enviava.
 *
 * Vale por um motivo comercial: quase todo atraso de projeto começa aqui, e ter
 * isso escrito muda a conversa de "vocês atrasaram" para "faltou o material que
 * combinamos". Por isso cada item é um cartão numerado, e não um bullet — dá
 * peso de checklist, não de rodapé.
 */
export function Responsabilidades({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="responsabilidades"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "O que precisamos de você"}
      largura="ampla"
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar
          como="p"
          className="mb-14 max-w-3xl text-destaque leading-relaxed text-[var(--ctx-texto)]"
        >
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada como="ul" className="grid gap-4 sm:grid-cols-2">
        {dados.itens.map((it, i) => (
          <ItemRevelado
            key={i}
            como="li"
            className="cartao-luz flex items-start gap-4 rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] p-6 transition-colors duration-300 hover:border-[var(--ctx-acento)] motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className="tipo-mono mt-0.5 shrink-0 text-miudo text-[var(--ctx-acento)]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-[var(--ctx-titulo)]">{it.item}</p>
              {it.detalhe && (
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--ctx-neblina)]">
                  {it.detalhe}
                </p>
              )}
            </div>
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
