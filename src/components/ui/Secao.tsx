import type { ReactNode } from "react";

/**
 * Casca comum de toda seção: largura de leitura, respiro vertical e o título
 * com a régua de latão. Centraliza o ritmo da página num lugar só — mudar o
 * espaçamento aqui muda a página inteira de forma coerente.
 */
export function Secao({
  id,
  titulo,
  etiqueta,
  children,
  largura = "leitura",
}: {
  id: string;
  titulo?: string;
  etiqueta?: string;
  children: ReactNode;
  largura?: "leitura" | "ampla";
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full px-6 py-secao sm:px-8 ${
        largura === "leitura" ? "max-w-3xl" : "max-w-6xl"
      }`}
    >
      {(titulo || etiqueta) && (
        <header className="mb-10 sm:mb-14" data-reveal>
          {etiqueta && (
            <p className="numero mb-4 text-xs uppercase tracking-[0.2em] text-latao">
              {etiqueta}
            </p>
          )}
          {titulo && (
            <h2 className="tipo-display text-titulo">{titulo}</h2>
          )}
          <div
            aria-hidden
            className="mt-6 h-px w-16 bg-latao"
          />
        </header>
      )}
      {children}
    </section>
  );
}
