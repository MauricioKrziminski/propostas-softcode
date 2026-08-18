"use client";

import { useRef } from "react";
import { useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

/**
 * PERCURSO DE SCROLL — o motor do que o cliente PRECISA ver.
 *
 * Por que não CSS `view()`/`scroll()`: `animation-timeline` só existe no iOS 26+
 * e nunca no Firefox. Um cliente com iPhone em iOS 18 abre o link do WhatsApp e
 * vê tudo parado. O `useScroll` do motion é rAF — roda em todo aparelho.
 *
 * A regra do projeto passa a ser:
 *   · decoração (filetes, brilhos de fundo) → CSS scroll-driven, some em silêncio
 *   · efeito essencial (gesto do hero, progresso, odômetro) → daqui
 */
export function usePercurso(offset: Parametros["offset"] = ["start start", "end start"]) {
  const alvo = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: alvo, offset });
  return { alvo, progresso: scrollYProgress };
}

type Parametros = Parameters<typeof useScroll>[0] & object;

/** Progresso de leitura da página inteira, amortecido para não tremer. */
export function useProgressoDaPagina(): MotionValue<number> {
  const { scrollYProgress } = useScroll();
  return useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
}

/**
 * Cortina de `clip-path`: o polígono precisa ter a MESMA contagem de vértices
 * nos dois extremos, senão o navegador não interpola e o efeito vira um salto.
 */
export function useCortina(progresso: MotionValue<number>) {
  return useTransform(
    progresso,
    [0, 1],
    [
      "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      "polygon(0% 42%, 100% 42%, 100% 58%, 0% 58%)",
    ],
  );
}
