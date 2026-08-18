import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { ForaDoEscopo as Dados } from "@/lib/proposta/schema";

/**
 * Seção deliberadamente SÓBRIA — sem cartão, sem vidro, sem numeral gigante.
 *
 * Uma seção quieta faz as outras respirarem, e o conteúdo aqui pede exatamente
 * isso: dizer o que não está incluído sem soar defensivo nem decorado. O único
 * gesto é o traço de acento à esquerda de cada item.
 */
export function ForaDoEscopo({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="fora-do-escopo"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Fora do escopo"}
      ritmo="denso"
    >
      <ListaRevelada
        como="ul"
        className="divide-y divide-[var(--ctx-linha)] border-y border-[var(--ctx-linha)]"
      >
        {dados.itens.map((item, i) => (
          <ItemRevelado
            key={i}
            como="li"
            className="flex items-baseline gap-4 py-5 text-[var(--ctx-neblina)]"
          >
            <span
              aria-hidden
              className="h-px w-4 shrink-0 translate-y-[-0.35em] bg-[var(--ctx-acento)] opacity-60"
            />
            <span>{item}</span>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.nota && (
        <Revelar como="p" className="mt-8 text-sm text-[var(--ctx-neblina)]">
          {dados.nota}
        </Revelar>
      )}
    </Secao>
  );
}
