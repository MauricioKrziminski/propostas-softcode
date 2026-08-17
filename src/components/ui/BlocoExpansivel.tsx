import type { ReactNode } from "react";

/**
 * `<details>` nativo, de propósito: acessível por teclado sem uma linha de JS,
 * anunciado corretamente por leitor de tela e — o que mais importa aqui —
 * imprimível. O print.css e o listener `beforeprint` abrem todos antes do PDF.
 *
 * O escopo detalhado existe para não intimidar de cara: o cliente vê os títulos
 * e abre só o que interessa a ele.
 */
export function BlocoExpansivel({
  titulo,
  resumo,
  indice,
  ordem = 0,
  children,
}: {
  titulo: string;
  resumo?: string;
  indice: number;
  ordem?: number;
  children: ReactNode;
}) {
  return (
    <details
      className="group border-b border-linha"
      style={{ ["--i" as string]: ordem }}
    >
      <summary className="alvo-toque flex cursor-pointer list-none items-start gap-4 py-6 pr-2 [&::-webkit-details-marker]:hidden">
        <span className="numero mt-1 shrink-0 text-xs text-acento">
          {String(indice).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span className="block text-lg leading-snug text-navy">{titulo}</span>
          {resumo && (
            <span className="mt-1 block text-sm text-neblina">{resumo}</span>
          )}
        </span>
        <span
          aria-hidden
          className="mt-2 shrink-0 text-acento transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
        >
          {/* cruz que vira X ao abrir — micro-interação em elemento acionável */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </summary>
      <div className="pb-8 pl-10 pr-2 text-neblina">{children}</div>
    </details>
  );
}
