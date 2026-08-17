"use client";

import { useEffect } from "react";

/**
 * Alimenta `--mx`/`--my` nos cartões com a posição do ponteiro.
 *
 * Só registra quando existe ponteiro fino E o usuário não pediu menos
 * movimento. No celular nada disto roda — lá a mesma luz é conduzida pelo
 * scroll (`.etapa-luz`, em globals.css), que é o driver que existe no touch.
 *
 * Usa `pointermove` no container (um listener, não um por cartão) e escreve
 * apenas custom properties, que alimentam a opacidade de um pseudo-elemento.
 * Nenhum listener de `scroll` em lugar nenhum.
 */
export function LuzDoPonteiro({ seletor = ".cartao-luz" }: { seletor?: string }) {
  useEffect(() => {
    const finoEDisponivel = window.matchMedia("(hover: hover) and (pointer: fine)");
    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finoEDisponivel.matches || menosMovimento.matches) return;

    let quadroAgendado = 0;
    let ultimo: { alvo: HTMLElement; x: number; y: number } | null = null;

    const aplicar = () => {
      quadroAgendado = 0;
      if (!ultimo) return;
      ultimo.alvo.style.setProperty("--mx", `${ultimo.x}%`);
      ultimo.alvo.style.setProperty("--my", `${ultimo.y}%`);
    };

    const aoMover = (e: PointerEvent) => {
      const alvo = (e.target as Element | null)?.closest<HTMLElement>(seletor);
      if (!alvo) return;
      const r = alvo.getBoundingClientRect();
      ultimo = {
        alvo,
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      };
      quadroAgendado ||= requestAnimationFrame(aplicar);
    };

    document.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      document.removeEventListener("pointermove", aoMover);
      if (quadroAgendado) cancelAnimationFrame(quadroAgendado);
    };
  }, [seletor]);

  return null;
}
