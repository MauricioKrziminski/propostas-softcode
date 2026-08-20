"use client";

import { useSyncExternalStore } from "react";

/**
 * Lê uma media query e REAGE a mudanças dela.
 *
 * `useSyncExternalStore` em vez de `useState` + `useEffect`: além de ser o que
 * o React 19 pede para fonte externa (e o que o lint cobra), ele reavalia
 * quando a consulta muda, girar o tablet ou plugar um mouse passa a ligar ou
 * desligar o efeito sozinho, sem recarregar a página.
 *
 * No servidor devolve `false`: nada que dependa de viewport pode ser assumido
 * na renderização inicial.
 */
export function useMidia(consulta: string): boolean {
  return useSyncExternalStore(
    (aoMudar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", aoMudar);
      return () => mq.removeEventListener("change", aoMudar);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

/** Desktop com ponteiro fino, o único lugar onde enfeite pesado é aceitável. */
export const DESKTOP_FINO = "(min-width: 1024px) and (pointer: fine)";

/**
 * Altura da JANELA em px, e o MESMO número que o motion usa como denominador do
 * progresso de scroll (`container.clientHeight`).
 *
 * Traduzir por `100dvh` erraria: no iOS o viewport de layout e o dinâmico
 * diferem pela barra do Safari, e a seção "congelada" da cortina derraparia até
 * uns 100px no meio do congelamento, que é um defeito bem no meio do efeito.
 *
 * No servidor devolve 0, então nenhum transform é escrito antes da hidratação:
 * é o estado certo para quem abre com JS lento.
 */
export function useAlturaDaJanela(): number {
  return useSyncExternalStore(
    (aoMudar) => {
      window.addEventListener("resize", aoMudar);
      return () => window.removeEventListener("resize", aoMudar);
    },
    () => document.documentElement.clientHeight,
    () => 0,
  );
}

/**
 * Largura da janela em px. Serve para medidas que precisam ser PROPORCIONAIS à
 * tela e não dá para escrever em `vw`, porque quem as consome é um valor de
 * movimento em JS (a barriga do arco da cortina, por exemplo).
 *
 * No servidor devolve 0, pelo mesmo motivo da altura.
 */
export function useLarguraDaJanela(): number {
  return useSyncExternalStore(
    (aoMudar) => {
      window.addEventListener("resize", aoMudar);
      return () => window.removeEventListener("resize", aoMudar);
    },
    () => document.documentElement.clientWidth,
    () => 0,
  );
}
