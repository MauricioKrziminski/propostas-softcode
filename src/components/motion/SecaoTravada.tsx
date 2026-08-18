"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";

/**
 * Seção que TRAVA na tela e troca o conteúdo conforme o scroll.
 *
 * A mecânica: um contêiner alto (um "andar" por painel) com um bloco `sticky`
 * dentro. Enquanto o contêiner atravessa a viewport, o bloco fica parado e o
 * painel ativo avança com o progresso do scroll — o dedo rola, o conteúdo muda,
 * a página não sai do lugar.
 *
 * O progresso vira barra e numeração: sem isso, seção travada dá a sensação de
 * que o scroll quebrou.
 *
 * A API recebe os painéis JÁ RENDERIZADOS (`ReactNode[]`), e não funções de
 * render — função não atravessa a fronteira Server → Client Component, e quem
 * monta os painéis aqui é sempre um Server Component.
 *
 * Com reduced-motion NÃO trava nada: os painéis saem empilhados e a seção rola
 * como qualquer outra. Prender o scroll de quem pediu menos movimento seria o
 * oposto de acessível.
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

  const barra = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

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
        {/* progresso: onde estou e quanto falta */}
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

        <div className={`relative ${moldura ?? ""}`}>
          {paineis.map((painel, i) => (
            <motion.div
              key={i}
              aria-hidden={i !== ativo}
              className={
                i === ativo ? "relative" : "pointer-events-none absolute inset-0"
              }
              initial={false}
              animate={
                i === ativo
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: i < ativo ? -32 : 32 }
              }
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            >
              {painel}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
