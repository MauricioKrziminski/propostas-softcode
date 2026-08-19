import Link from "next/link";

import { sair } from "@/app/painel/acoes";

/**
 * A barra do topo: onde estou, o que dá para fazer, e a saída.
 *
 * Ela mostra o caminho (propostas › cliente › seção) em vez de um título solto,
 * porque o painel tem três níveis e perder-se entre eles é o jeito mais fácil de
 * a ferramenta cansar. O `⌘K` fica visível de propósito: atalho que ninguém vê
 * é atalho que ninguém usa.
 */
export function BarraDaMesa({
  caminho,
  acoes,
}: {
  caminho: { rotulo: string; href?: string }[];
  acoes?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--mesa-fio)] bg-[color-mix(in_srgb,var(--mesa-fundo)_88%,transparent)] backdrop-blur-[6px]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/painel"
          className="flex min-h-11 items-center gap-2 text-[var(--mesa-tinta)]"
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-[3px] bg-[var(--mesa-acento)]"
          />
          <span className="titulo-mesa text-[1.0625rem]">Mesa</span>
        </Link>

        <nav aria-label="Trilha" className="flex min-w-0 items-center gap-2">
          {caminho.map((passo) => (
            <span key={passo.rotulo} className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="text-[var(--mesa-tinta-apagada)]">
                ›
              </span>
              {passo.href ? (
                <Link
                  href={passo.href}
                  className="etiqueta-mesa truncate hover:text-[var(--mesa-tinta)]"
                >
                  {passo.rotulo}
                </Link>
              ) : (
                <span className="etiqueta-mesa truncate text-[var(--mesa-tinta-suave)]">
                  {passo.rotulo}
                </span>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {acoes}
          <form action={sair}>
            <button type="submit" className="botao-mesa px-3">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
