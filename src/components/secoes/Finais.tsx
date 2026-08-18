import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar } from "@/components/motion/Revelar";
import type { Finais as Dados } from "@/lib/proposta/schema";

/**
 * O fecho, logo antes do aceite.
 *
 * Existe para a proposta terminar com uma frase de gente, e não com uma tabela
 * de preço. Tipografia maior que o corpo comum: é o último texto lido antes da
 * decisão, e merece o peso de uma carta.
 */
export function Finais({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="consideracoes-finais"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Considerações finais"}
      ritmo="denso"
    >
      <div className="flex flex-col gap-6">
        {dados.paragrafos.map((paragrafo, i) => (
          <Revelar
            key={i}
            como="p"
            atraso={i * 0.08}
            className="max-w-3xl text-destaque leading-relaxed text-[var(--ctx-texto)]"
          >
            {paragrafo}
          </Revelar>
        ))}
      </div>

      {dados.contato && (
        <Revelar
          como="p"
          className="tipo-mono mt-10 border-t border-[var(--ctx-linha)] pt-6 text-miudo uppercase tracking-[0.24em] text-[var(--ctx-acento)]"
        >
          {dados.contato}
        </Revelar>
      )}
    </Secao>
  );
}
