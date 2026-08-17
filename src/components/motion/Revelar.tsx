"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * POR QUE ISTO EXISTE, e por que o CSS scroll-driven não bastava.
 *
 * Reveal conduzido por `animation-timeline: view()` é uma FUNÇÃO da posição do
 * scroll: o elemento só se move enquanto você rola, e para no instante em que
 * você para. Quem rola rápido — que é o normal no celular — vê tudo já no
 * estado final e conclui, com razão, que não tem animação nenhuma.
 *
 * Aqui a animação é por TEMPO: entra na viewport, dispara e roda até o fim com
 * mola, independente do scroll. É isso que se lê como "animado".
 *
 * O scroll-driven continua onde ele é o certo — a corda entre seções, o filete
 * do processo, o gesto do hero — porque ali o progresso do scroll É o conteúdo
 * da animação.
 */

const MOLA = { type: "spring", stiffness: 90, damping: 18, mass: 0.9 } as const;

type Direcao = "baixo" | "esquerda" | "direita" | "escala";

const DESLOCAMENTO: Record<Direcao, { x?: number; y?: number; scale?: number }> = {
  baixo: { y: 64 },
  esquerda: { x: -56 },
  direita: { x: 56 },
  escala: { scale: 0.9 },
};

export function Revelar({
  children,
  direcao = "baixo",
  atraso = 0,
  className,
  como = "div",
}: {
  children: ReactNode;
  direcao?: Direcao;
  atraso?: number;
  className?: string;
  como?: "div" | "li" | "section" | "article" | "p";
}) {
  const menosMovimento = useReducedMotion();
  const Componente = motion[como];

  if (menosMovimento) {
    return <Componente className={className}>{children}</Componente>;
  }

  return (
    <Componente
      className={className}
      initial={{ opacity: 0, ...DESLOCAMENTO[direcao] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -12% 0px" }}
      transition={{ ...MOLA, delay: atraso }}
    >
      {children}
    </Componente>
  );
}

/**
 * Lista com entrada encadeada: o container rege, os filhos entram em sequência.
 * O atraso vive no `staggerChildren`, então acrescentar item não exige recalcular
 * atraso nenhum na mão.
 */
const CONTAINER: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const FILHO: Variants = {
  oculto: { opacity: 0, y: 48 },
  visivel: { opacity: 1, y: 0, transition: MOLA },
};

export function ListaRevelada({
  children,
  className,
  como = "div",
}: {
  children: ReactNode;
  className?: string;
  como?: "div" | "ul" | "ol";
}) {
  const menosMovimento = useReducedMotion();
  const Componente = motion[como];

  if (menosMovimento) {
    return <Componente className={className}>{children}</Componente>;
  }

  return (
    <Componente
      className={className}
      variants={CONTAINER}
      initial="oculto"
      whileInView="visivel"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </Componente>
  );
}

export function ItemRevelado({
  children,
  className,
  como = "div",
}: {
  children: ReactNode;
  className?: string;
  como?: "div" | "li" | "article";
}) {
  const menosMovimento = useReducedMotion();
  const Componente = motion[como];

  if (menosMovimento) {
    return <Componente className={className}>{children}</Componente>;
  }

  return (
    <Componente className={className} variants={FILHO}>
      {children}
    </Componente>
  );
}
