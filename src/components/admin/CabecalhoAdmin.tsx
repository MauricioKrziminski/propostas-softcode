import Link from "next/link";

import { sair } from "@/app/admin/acoes";

/** Barra do painel: volta para a lista e sai. Nada mais. */
export function CabecalhoAdmin({ titulo, voltar }: { titulo: string; voltar?: boolean }) {
  return (
    <header className="border-b border-linha bg-fundo">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/admin"
          className="flex min-h-11 items-center font-display text-lg font-bold text-navy"
        >
          Propostas
        </Link>

        {voltar && (
          <Link
            href="/admin"
            className="flex min-h-11 items-center text-sm text-acento hover:underline"
          >
            voltar para a lista
          </Link>
        )}

        <span className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-neblina sm:inline">{titulo}</span>
          <form action={sair}>
            <button
              type="submit"
              className="min-h-11 rounded-lg border border-linha px-4 text-sm text-neblina hover:border-acento hover:text-acento"
            >
              Sair
            </button>
          </form>
        </span>
      </div>
    </header>
  );
}
