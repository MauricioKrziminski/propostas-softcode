"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O convite: a primeira coisa que o cliente vê ao abrir o link do WhatsApp.
 *
 * Um cartão que se anuncia, a aba do envelope abrindo, o nome da empresa e um
 * botão. Ao abrir, o convite sai em escala e a proposta entra por trás.
 *
 * Decisões que sustentam isso sem quebrar nada:
 *   · o overlay é renderizado no SSR, então não existe piscada da proposta
 *     antes dele aparecer;
 *   · um <noscript> o esconde: sem JS não haveria como fechá-lo, e a proposta
 *     precisa continuar legível de qualquer jeito;
 *   · `.so-tela` o remove da impressão — no PDF ele não existe;
 *   · com reduced-motion o cartão já nasce aberto, sem aba e sem transição;
 *   · o foco vai para o botão e o Esc também abre, porque ficar preso num
 *     overlay é a pior coisa que um convite pode fazer.
 */
export function Convite({
  empresa,
  projeto,
  aoAbrir,
}: {
  empresa: string;
  projeto: string;
  aoAbrir: () => void;
}) {
  const [saindo, setSaindo] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const abrir = () => {
    if (saindo) return;
    setSaindo(true);
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(aoAbrir, menos ? 0 : 560);
  };

  useEffect(() => {
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => botaoRef.current?.focus(), menos ? 0 : 1700);
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") abrir();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", aoTeclar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <noscript>
        <style>{`#convite{display:none!important}`}</style>
      </noscript>

      <div
        id="convite"
        role="dialog"
        aria-modal="true"
        aria-label={`Proposta para ${empresa}`}
        className={`so-tela fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-fundo px-6 ${
          saindo ? "convite-saindo pointer-events-none" : ""
        }`}
      >
        {/* brilho de marca ao fundo, pulsando devagar */}
        <div
          aria-hidden
          className="convite-brilho pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--color-acento)_0%,transparent_65%)] opacity-50 blur-3xl"
        />

        <div className="convite-cartao relative w-full max-w-md [perspective:1400px]">
          {/* aba do envelope: gira para trás e revela o cartão */}
          <div
            aria-hidden
            className="convite-aba absolute inset-x-0 top-0 z-20 h-24 origin-top [backface-visibility:hidden] [transform-style:preserve-3d]"
          >
            <div className="h-full w-full [clip-path:polygon(0_0,100%_0,50%_100%)] bg-elevado" />
          </div>

          <div className="relative overflow-hidden border border-linha bg-superficie px-7 py-12 text-center sm:px-10 sm:py-14">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-acento"
            />

            <div className="convite-conteudo">
              <p className="text-xs uppercase tracking-[0.28em] text-neblina">
                Proposta para
              </p>

              <p className="tipo-display mt-4 text-[clamp(2rem,10vw,3.25rem)] leading-[1.05] text-osso">
                {empresa}
              </p>

              <span
                aria-hidden
                className="mx-auto mt-6 block h-px w-14 bg-acento"
              />

              <p className="mt-6 text-sm leading-relaxed text-neblina">{projeto}</p>

              <button
                ref={botaoRef}
                type="button"
                onClick={abrir}
                className="alvo-toque mt-9 inline-flex items-center justify-center rounded-full bg-acento px-8 py-3.5 text-sm uppercase tracking-[0.14em] text-osso transition-colors duration-200 hover:bg-acento-claro motion-reduce:transition-none"
              >
                Ver a proposta
              </button>

              <p className="mt-5 text-xs text-neblina">
                SoftCode · leva cerca de 6 minutos
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
