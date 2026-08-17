import { Secao } from "@/components/ui/Secao";
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
      <ul className="divide-y divide-linha border-y border-linha">
        {dados.itens.map((item, i) => (
          <li key={i} className="py-4 text-salvia">
            {item}
          </li>
        ))}
      </ul>

      {dados.nota && <p className="mt-6 text-sm text-salvia">{dados.nota}</p>}
    </Secao>
  );
}
