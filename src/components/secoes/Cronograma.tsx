import { Secao } from "@/components/ui/Secao";
import type { Cronograma as Dados } from "@/lib/proposta/schema";

/**
 * Timeline vertical no celular, com as barras proporcionais à duração.
 *
 * Dois movimentos, ambos só com transform: a linha do tempo se desenha de cima
 * para baixo (`scaleY`) enquanto a seção atravessa a viewport, e cada barra de
 * fase cresce com `scaleX` — nunca `width`, que dispararia layout por frame.
 */
export function Cronograma({ dados }: { dados: Dados }) {
  const total = dados.fases.reduce((s, f) => s + f.semanas, 0);
  const maior = Math.max(...dados.fases.map((f) => f.semanas));

  return (
    <Secao id="cronograma" etiqueta="05" titulo={dados.titulo ?? "Cronograma"}>
      <p className="mb-12 text-salvia" data-reveal>
        <span className="numero text-osso">{total} semanas</span> no total, do
        planejamento à publicação.
      </p>

      <ol className="relative pl-8 sm:pl-10">
        {/* trilho + linha do tempo que se desenha */}
        <div aria-hidden className="absolute bottom-2 left-[3px] top-2 w-px bg-linha">
          <div className="linha-tempo h-full w-full bg-latao/60" />
        </div>

        {dados.fases.map((fase, i) => (
          <li
            key={fase.nome}
            className="fase-cronograma relative pb-10 last:pb-0"
            style={{ ["--i" as string]: i }}
            data-reveal
          >
            <span
              aria-hidden
              className="ponto-fase absolute -left-8 top-2 h-[7px] w-[7px] rounded-full bg-latao sm:-left-10"
            />

            <div className="flex items-baseline justify-between gap-4">
              <h3 className="flex items-baseline gap-3 text-lg text-osso">
                <span className="numero text-xs text-latao">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {fase.nome}
              </h3>
              <span className="numero shrink-0 text-sm text-salvia">
                {fase.duracao}
              </span>
            </div>

            <div className="mt-3 h-1 w-full bg-linha">
              <div
                className="barra-fase h-full bg-latao"
                style={{ width: `${(fase.semanas / maior) * 100}%` }}
              />
            </div>

            {fase.descricao && (
              <p className="mt-3 text-sm text-salvia">{fase.descricao}</p>
            )}
          </li>
        ))}
      </ol>

      {dados.observacao && (
        <p className="mt-10 border-t border-linha pt-6 text-sm text-salvia" data-reveal>
          {dados.observacao}
        </p>
      )}
    </Secao>
  );
}
