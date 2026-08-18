import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar } from "@/components/motion/Revelar";
import type { Indicacao as Dados } from "@/lib/proposta/schema";

/**
 * O programa de indicação.
 *
 * É a única seção que fala de um benefício futuro em vez do projeto em si, e o
 * desenho acompanha: o percentual em escala grande carrega a informação sozinho,
 * e o texto explica em volta. Sem cartão e sem lista, para não competir com o
 * investimento, que é a seção que precisa ganhar a atenção.
 */
export function Indicacao({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="indicacao"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Programa de indicação"}
      ritmo="denso"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
        <Revelar direcao="escala" className="shrink-0">
          <span className="tipo-display block text-mega leading-none text-[var(--ctx-acento)]">
            {dados.percentual}%
          </span>
        </Revelar>

        <Revelar como="p" className="max-w-2xl leading-relaxed text-[var(--ctx-texto)]">
          {dados.texto}
        </Revelar>
      </div>
    </Secao>
  );
}
