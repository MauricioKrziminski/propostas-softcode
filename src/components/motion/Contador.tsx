"use client";

import { useEffect, useRef } from "react";
import { formatarValor } from "@/lib/proposta/formatar";

/**
 * Contagem numérica ao entrar na viewport.
 *
 * O valor final é renderizado no servidor: sem JS, com reduced-motion ou com o
 * observer indisponível, o cliente vê o número certo, a animação nunca é
 * pré-requisito para ler o preço.
 *
 * `IntersectionObserver`, nunca evento de scroll. `tabular-nums` no elemento
 * garante largura estável durante a contagem, então trocar o texto não
 * reposiciona nada em volta.
 */
export function Contador({
  valorCentavos,
  className = "",
}: {
  valorCentavos: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let quadro = 0;
    let comecou = false;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting || comecou) return;
        comecou = true;
        observador.disconnect();

        const inicio = performance.now();
        const duracao = 900;
        const suavizar = (t: number) => 1 - Math.pow(1 - t, 3);

        const passo = (agora: number) => {
          const t = Math.min((agora - inicio) / duracao, 1);
          el.textContent = formatarValor(Math.round(valorCentavos * suavizar(t)));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.6 },
    );

    observador.observe(el);
    return () => {
      observador.disconnect();
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [valorCentavos]);

  return (
    <span ref={ref} className={`numero ${className}`}>
      {formatarValor(valorCentavos)}
    </span>
  );
}
