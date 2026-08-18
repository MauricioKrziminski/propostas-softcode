import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { BlocoExpansivel } from "@/components/ui/BlocoExpansivel";
import { Revelar } from "@/components/motion/Revelar";
import type { Escopo as Dados } from "@/lib/proposta/schema";

/**
 * O escopo é a seção mais densa da proposta, e a que mais intimida de cara.
 *
 * Vira uma PILHA: cada módulo é um cartão que gruda no topo e o próximo sobe por
 * cima, deixando uma escadinha visível. O cliente vê quantos módulos existem sem
 * precisar rolar tudo, e abre só o que interessa a ele.
 *
 * Sem `space-y` entre os cartões, a pilha depende de eles se encostarem.
 */
export function Escopo({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="escopo"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Escopo detalhado"}
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar
          como="p"
          className="mb-12 text-destaque leading-relaxed text-[var(--ctx-texto)]"
        >
          {dados.introducao}
        </Revelar>
      )}

      <div className="flex flex-col gap-3">
        {dados.modulos.map((modulo, i) => (
          <BlocoExpansivel
            key={modulo.titulo}
            indice={i + 1}
            ordem={i}
            titulo={modulo.titulo}
            resumo={modulo.resumo}
          >
            <ul className="space-y-3">
              {modulo.itens.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2.5 h-px w-3 shrink-0 bg-[var(--ctx-acento)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {modulo.entregaveis && modulo.entregaveis.length > 0 && (
              <div className="mt-7 rounded-xl border border-[var(--ctx-linha)] bg-[var(--ctx-elevado)] p-5">
                <p className="tipo-mono text-miudo uppercase tracking-[0.24em] text-[var(--ctx-acento)]">
                  Você recebe
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {modulo.entregaveis.map((e, j) => (
                    <li key={j}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </BlocoExpansivel>
        ))}
      </div>
    </Secao>
  );
}
