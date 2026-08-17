import { Secao } from "@/components/ui/Secao";
import { BlocoExpansivel } from "@/components/ui/BlocoExpansivel";
import type { Escopo as Dados } from "@/lib/proposta/schema";

/**
 * Sem animação de entrada nos blocos: é a seção mais densa da proposta, e
 * movimento aqui atrapalha a leitura em vez de servi-la.
 */
export function Escopo({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="escopo"
      etiqueta="03"
      titulo={dados.titulo ?? "Escopo detalhado"}
      ritmo="denso"
    >
      {dados.introducao && (
        <p className="mb-10 text-lg leading-relaxed text-neblina" data-reveal>
          {dados.introducao}
        </p>
      )}

      {/* Stagger na entrada dos módulos; a abertura em si tem transição real
          de altura (globals.css, via ::details-content + interpolate-size). */}
      <div className="border-t border-linha" data-stagger>
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
                  <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-acento" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {modulo.entregaveis && modulo.entregaveis.length > 0 && (
              <div className="mt-6 border-t border-linha pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-acento">
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
