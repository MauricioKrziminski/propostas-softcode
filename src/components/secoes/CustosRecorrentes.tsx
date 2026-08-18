import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { CustosRecorrentes as Dados } from "@/lib/proposta/schema";

/**
 * O que o valor NÃO cobre, em dinheiro recorrente.
 *
 * Fica logo depois do pagamento de propósito: é ali que o cliente pergunta
 * "então além disso eu pago mensalidade?". Responder na hora, sem ele precisar
 * perguntar, é o que separa proposta honesta de surpresa no segundo mês.
 */
export function CustosRecorrentes({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="custos-recorrentes"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Custos que não estão no valor"}
      ritmo="denso"
    >
      <Revelar como="p" className="max-w-3xl leading-relaxed text-[var(--ctx-texto)]">
        {dados.texto}
      </Revelar>

      {dados.itens && dados.itens.length > 0 && (
        <ListaRevelada
          como="ul"
          className="mt-8 divide-y divide-[var(--ctx-linha)] border-y border-[var(--ctx-linha)]"
        >
          {dados.itens.map((item, i) => (
            <ItemRevelado key={i} como="li" className="flex flex-wrap gap-x-6 gap-y-1 py-5">
              <span className="text-[var(--ctx-titulo)]">{item.item}</span>
              {item.detalhe && (
                <span className="text-sm text-[var(--ctx-neblina)]">{item.detalhe}</span>
              )}
            </ItemRevelado>
          ))}
        </ListaRevelada>
      )}
    </Secao>
  );
}
