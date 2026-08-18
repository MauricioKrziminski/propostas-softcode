"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Seção que TRAVA na tela e troca o conteúdo conforme o scroll.
 *
 * A mecânica: um contêiner alto (um "andar" por painel) com um bloco `sticky`
 * dentro. Enquanto o contêiner atravessa a viewport, o bloco fica parado e os
 * painéis se sucedem com o progresso do scroll.
 *
 * DUAS DECISÕES que definem se isso parece fluido ou quebrado:
 *
 * 1. O movimento é CONTÍNUO, derivado do progresso — não um estado que troca
 *    em limiares. Com troca discreta, rolar dentro de um passo não move nada e
 *    depois salta: o dedo anda e a tela não responde. Aqui cada painel tem
 *    opacidade, deslocamento e escala como função do scroll, então há sempre
 *    movimento proporcional ao dedo.
 *
 * 2. Os painéis vivem numa PILHA DE GRID (todos em `grid-area: 1/1`), não em
 *    `absolute` alternando com `relative`. Alternar posicionamento troca quem
 *    define a altura do contêiner e dispara reflow a cada troca — era a origem
 *    do travamento. Em grid, a altura é a do painel mais alto e nunca muda.
 *
 * Com reduced-motion NÃO trava nada: os painéis saem empilhados e a seção rola
 * como qualquer outra.
 */
export function SecaoTravada({
  paineis,
  alturaPorItem = 90,
  etiquetaProgresso,
  moldura,
}: {
  paineis: ReactNode[];
  /** Altura de scroll por painel, em vh. */
  alturaPorItem?: number;
  etiquetaProgresso?: string;
  /**
   * Classe da moldura que envolve os painéis. É AQUI que o vidro entra: só um
   * painel aparece por vez, então `backdrop-filter` em cada um seria GPU paga
   * cinco vezes sem nada em troca.
   */
  moldura?: string;
}) {
  const menosMovimento = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  /**
   * Um amortecimento leve no progresso. Sem ele o painel acompanha o scroll
   * 1:1 e fica trêmulo em trackpad e em rolagem por inércia; com mola demais
   * fica borrachudo e atrasa em relação ao dedo. Este é o meio-termo.
   */
  const percurso = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    mass: 0.35,
    restDelta: 0.0005,
  });

  const barra = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  // O índice serve só para o rótulo e para o `aria-hidden` — nunca para animar.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(paineis.length - 1, Math.max(0, Math.floor(v * paineis.length)));
    setAtivo((anterior) => (anterior === i ? anterior : i));
  });

  if (menosMovimento) {
    return (
      <div className="space-y-16">
        {paineis.map((painel, i) => (
          <div key={i}>{painel}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ height: `${paineis.length * alturaPorItem}vh` }}>
      <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-center py-16">
        <div className="mb-10 flex items-center gap-4">
          <span className="tipo-mono shrink-0 text-miudo uppercase tracking-[0.28em] text-[var(--ctx-acento)]">
            {etiquetaProgresso} {String(ativo + 1).padStart(2, "0")}
            <span className="text-[var(--ctx-neblina)]">
              /{String(paineis.length).padStart(2, "0")}
            </span>
          </span>
          <div className="h-px flex-1 bg-[var(--ctx-linha)]">
            <motion.div
              className="h-full origin-left bg-[var(--ctx-acento)]"
              style={{ scaleX: barra }}
            />
          </div>
        </div>

        {/* pilha de grid: altura constante, zero reflow na troca */}
        <div className={`grid ${moldura ?? ""}`}>
          {paineis.map((painel, i) => (
            <PainelTravado
              key={i}
              percurso={percurso}
              indice={i}
              total={paineis.length}
              oculto={i !== ativo}
            >
              {painel}
            </PainelTravado>
          ))}
        </div>
      </div>
    </div>
  );
}

function PainelTravado({
  percurso,
  indice,
  total,
  oculto,
  children,
}: {
  percurso: MotionValue<number>;
  indice: number;
  total: number;
  oculto: boolean;
  children: ReactNode;
}) {
  const passo = 1 / total;
  const centro = (indice + 0.5) * passo;

  // O primeiro nasce em cena e o último não sai: sem isso, a seção abriria e
  // fecharia em branco nas pontas.
  const primeiro = indice === 0;
  const ultimo = indice === total - 1;

  /**
   * Opacidade e posição usam janelas DIFERENTES, e é isso que faz a coisa
   * funcionar:
   *
   * · a POSIÇÃO percorre a janela inteira do painel — sempre há movimento
   *   proporcional ao dedo, que é o que faltava quando a troca era discreta;
   * · a OPACIDADE troca numa janela estreita, quase sequencial. Com as duas na
   *   mesma janela larga, os painéis ficavam legíveis ao mesmo tempo e os dois
   *   textos se sobrepunham no meio da transição — ilegível.
   *
   * A sobreposição sobrou em 4% de um passo: o suficiente para dissolver em vez
   * de piscar, e curto demais para alguém tentar ler os dois.
   */
  const faixaMovimento = [
    primeiro ? -0.4 : centro - passo * 0.7,
    primeiro ? -0.3 : centro - passo * 0.2,
    ultimo ? 1.3 : centro + passo * 0.2,
    ultimo ? 1.4 : centro + passo * 0.7,
  ];

  const faixaOpacidade = [
    primeiro ? -0.4 : centro - passo * 0.52,
    primeiro ? -0.3 : centro - passo * 0.34,
    ultimo ? 1.3 : centro + passo * 0.34,
    ultimo ? 1.4 : centro + passo * 0.52,
  ];

  const opacity = useTransform(percurso, faixaOpacidade, [0, 1, 1, 0]);
  const y = useTransform(percurso, faixaMovimento, [64, 0, 0, -64]);
  const scale = useTransform(percurso, faixaMovimento, [0.95, 1, 1, 0.95]);
  // Só o painel efetivamente legível recebe clique e seleção de texto.
  const pointerEvents = useTransform(opacity, (o) => (o > 0.55 ? "auto" : "none"));

  return (
    <motion.div
      aria-hidden={oculto}
      className="[grid-area:1/1]"
      style={{ opacity, y, scale, pointerEvents }}
    >
      {children}
    </motion.div>
  );
}
