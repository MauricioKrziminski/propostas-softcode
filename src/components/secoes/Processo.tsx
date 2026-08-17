import { Secao } from "@/components/ui/Secao";
import { ETAPAS } from "@/lib/proposta/processo";
import type { Processo as Dados } from "@/lib/proposta/schema";

/**
 * A alma da página — e onde o movimento é mais intenso de propósito.
 *
 * Quatro camadas de movimento encadeadas, todas em transform/opacity:
 *   1. o filete de latão se desenha ao longo das 6 etapas (`scaleY`, scroll);
 *   2. a borda esquerda de cada etapa se desenha quando ela chega;
 *   3. o número da etapa brota em escala;
 *   4. a etapa acende — no touch conduzida por `view()`, é ela que ocupa o
 *      lugar do efeito de mouse; em ponteiro fino a luz do cursor entra por
 *      cima (`cartao-luz`).
 *
 * A intenção é que a navegação diga o mesmo que o texto: um percurso contínuo,
 * com cuidado em cada parada.
 */
export function Processo({ dados }: { dados: Dados }) {
  if (!dados.mostrar) return null;

  return (
    <Secao
      id="processo"
      etiqueta="04"
      titulo={dados.titulo ?? "Como trabalhamos"}
      largura="ampla"
      ritmo="respiro"
    >
      {dados.introducao && (
        <p className="mb-16 max-w-3xl text-lg leading-relaxed text-neblina" data-reveal>
          {dados.introducao}
        </p>
      )}

      <ol className="relative">
        {/* trilho + filete que se desenha ao longo de toda a seção */}
        <div
          aria-hidden
          className="absolute bottom-0 left-5 top-0 w-px bg-linha sm:left-7"
        >
          <div className="filete-processo h-full w-full bg-acento" />
        </div>

        {ETAPAS.map((etapa) => (
          <li
            key={etapa.numero}
            className="etapa-processo cartao-luz relative pb-14 pl-14 last:pb-0 sm:pl-20"
          >
            {/* luz conduzida pelo scroll: o driver que existe no celular */}
            <span
              aria-hidden
              className="etapa-luz pointer-events-none absolute inset-y-0 -left-6 -z-10 w-[min(34rem,95%)] bg-gradient-to-r from-acento/10 via-acento/[0.03] to-transparent"
            />
            {/* borda que se desenha junto com a chegada da etapa */}
            <span
              aria-hidden
              className="etapa-borda absolute bottom-6 left-5 top-2 w-px bg-acento/40 sm:left-7"
            />

            <span
              aria-hidden
              className="etapa-numero numero absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-acento bg-fundo text-xs text-acento sm:h-14 sm:w-14 sm:text-base"
            >
              {String(etapa.numero).padStart(2, "0")}
            </span>

            <h3 className="tipo-display text-secao leading-tight text-osso">
              {etapa.titulo}
            </h3>
            <p className="mt-4 max-w-2xl text-neblina">{etapa.descricao}</p>

            <dl className="mt-6 grid max-w-2xl gap-4 border-t border-linha pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-acento">
                  Você recebe
                </dt>
                <dd className="mt-1.5 text-osso">{etapa.entrega}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-neblina">
                  Sua parte
                </dt>
                <dd className="mt-1.5 text-neblina">{etapa.suaParte}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
