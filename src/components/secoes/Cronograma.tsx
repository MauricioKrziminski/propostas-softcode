"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import { usePercurso } from "@/components/motion/percurso";
import type { Cronograma as Dados } from "@/lib/proposta/schema";

/**
 * A linha do tempo se desenha conforme a seção atravessa a viewport.
 *
 * O traço vem de `useScroll` (rAF) e não de `view()` do CSS: aqui o progresso do
 * scroll É o conteúdo — a linha crescendo é a metáfora do projeto avançando —
 * e isso precisa acontecer também no iPhone do cliente, onde
 * `animation-timeline` não existe antes do iOS 26.
 *
 * As barras de duração continuam em CSS scroll-driven: aquilo é decoração, e
 * pode sumir em silêncio onde não houver suporte.
 */
export function Cronograma({ dados, numero }: { dados: Dados; numero: number }) {
  const menosMovimento = useReducedMotion();
  const { alvo, progresso } = usePercurso(["start 80%", "end 60%"]);
  const traco = useTransform(progresso, [0, 1], [0, 1]);

  const total = dados.fases.reduce((s, f) => s + f.semanas, 0);
  const maior = Math.max(...dados.fases.map((f) => f.semanas));

  return (
    <Secao
      id="cronograma"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Cronograma"}
    >
      <Revelar como="p" className="mb-14 text-[var(--ctx-neblina)]">
        <span className="tipo-mono text-[var(--ctx-titulo)]">{total} semanas</span> no
        total, do planejamento à publicação.
      </Revelar>

      <div ref={alvo}>
        <ListaRevelada como="ol" className="relative pl-9 sm:pl-12">
          {/* trilho + traço que se desenha */}
          <div
            aria-hidden
            className="absolute bottom-3 left-[5px] top-3 w-px bg-[var(--ctx-linha)]"
          >
            <motion.div
              className="h-full w-full origin-top bg-[var(--ctx-acento)]"
              style={menosMovimento ? { scaleY: 1 } : { scaleY: traco }}
            />
          </div>

          {dados.fases.map((fase, i) => (
            <ItemRevelado
              key={fase.nome}
              como="li"
              className="fase-cronograma relative pb-12 last:pb-0"
            >
              <span
                aria-hidden
                className="ponto-fase absolute -left-9 top-2 h-[11px] w-[11px] rounded-full border-2 border-[var(--ctx-fundo)] bg-[var(--ctx-acento)] sm:-left-12"
              />

              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="tipo-display flex items-baseline gap-3 text-[clamp(1.125rem,2.4vw,1.5rem)]">
                  <span className="tipo-mono text-miudo text-[var(--ctx-acento)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {fase.nome}
                </h3>
                <span className="tipo-mono shrink-0 text-sm text-[var(--ctx-neblina)]">
                  {fase.duracao}
                </span>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--ctx-linha)]">
                <div
                  className="barra-fase h-full rounded-full bg-[var(--ctx-acento)]"
                  style={{ width: `${(fase.semanas / maior) * 100}%` }}
                />
              </div>

              {fase.descricao && (
                <p className="mt-4 text-sm leading-relaxed text-[var(--ctx-neblina)]">
                  {fase.descricao}
                </p>
              )}
            </ItemRevelado>
          ))}
        </ListaRevelada>
      </div>

      {dados.observacao && (
        <Revelar
          como="p"
          className="mt-12 border-t border-[var(--ctx-linha)] pt-6 text-sm text-[var(--ctx-neblina)]"
        >
          {dados.observacao}
        </Revelar>
      )}
    </Secao>
  );
}
