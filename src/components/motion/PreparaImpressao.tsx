"use client";

import { useEffect } from "react";

/**
 * Abre todo `<details>` antes de imprimir e restaura depois.
 *
 * Sem isto, o escopo detalhado, a seção mais densa da proposta, sai do PDF
 * com só os títulos. O `details::details-content` do print.css cobre os
 * navegadores que já suportam o pseudo-elemento; este listener cobre o resto.
 *
 * Também é o gatilho do botão "baixar em PDF": nada mais que `window.print()`,
 * sem infra e sem custo por geração.
 */
export function PreparaImpressao() {
  useEffect(() => {
    let abertosPeloScript: HTMLDetailsElement[] = [];

    const antes = () => {
      abertosPeloScript = [
        ...document.querySelectorAll<HTMLDetailsElement>("details:not([open])"),
      ];
      for (const d of abertosPeloScript) d.open = true;
    };

    const depois = () => {
      for (const d of abertosPeloScript) d.open = false;
      abertosPeloScript = [];
    };

    window.addEventListener("beforeprint", antes);
    window.addEventListener("afterprint", depois);
    return () => {
      window.removeEventListener("beforeprint", antes);
      window.removeEventListener("afterprint", depois);
    };
  }, []);

  return null;
}
