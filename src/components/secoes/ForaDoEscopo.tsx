import { Secao } from "@/components/ui/Secao";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { ForaDoEscopo as Dados } from "@/lib/proposta/schema";

/**
 * Seção deliberadamente SEM movimento nenhum.
 * Uma seção quieta faz as outras respirarem — e o conteúdo aqui pede sobriedade,
 * não apresentação.
 */
export function ForaDoEscopo({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="fora-do-escopo"
      etiqueta="07"
      titulo={dados.titulo ?? "Fora do escopo"}
      ritmo="denso"
    >
      <ListaRevelada como="ul" className="divide-y divide-linha border-y border-linha">
        {dados.itens.map((item, i) => (
          <ItemRevelado key={i} como="li" className="py-4 text-neblina">
            {item}
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.nota && (
        <Revelar como="p" className="mt-6 text-sm text-neblina">
          {dados.nota}
        </Revelar>
      )}
    </Secao>
  );
}
