"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { duplicar, mudarStatus } from "@/app/admin/acoes";
import type { ResumoProposta } from "@/lib/proposta/repositorio";
import { BotaoCopiar } from "./BotaoCopiar";
import { Comando, type ItemDeComando } from "./Comando";
import { TrilhaDeStatus } from "./TrilhaDeStatus";

/**
 * A lista.
 *
 * Duas decisões que mudam o uso no dia a dia:
 *
 *   · A busca filtra empresa, projeto e endereço ao mesmo tempo, no navegador.
 *     São dezenas de propostas, não milhares: filtrar no cliente é instantâneo e
 *     dispensa uma ida ao servidor a cada tecla.
 *
 *   · As ações ficam SEMPRE visíveis, não no hover. Esconder ação atrás de hover
 *     quebra no celular, que é metade do uso desta tela.
 */
export function ListaDePropostas({
  propostas,
  base,
}: {
  propostas: ResumoProposta[];
  base: string;
}) {
  const navegador = useRouter();
  const [busca, setBusca] = useState("");
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return propostas.filter((p) => {
      if (!mostrarArquivadas && p.status === "arquivada") return false;
      if (!termo) return true;
      return `${p.empresa} ${p.tituloProjeto} ${p.caminho} ${p.contato}`
        .toLowerCase()
        .includes(termo);
    });
  }, [propostas, busca, mostrarArquivadas]);

  const arquivadas = propostas.filter((p) => p.status === "arquivada").length;

  /* Na lista o `⌘K` é atalho de navegação: com dez clientes, digitar três letras
     do nome chega antes que procurar a linha com os olhos. */
  const comandos: ItemDeComando[] = [
    {
      id: "nova",
      grupo: "ação",
      rotulo: "Nova proposta",
      executar: () => navegador.push("/admin/nova"),
    },
    ...propostas.map((p) => ({
      id: `abrir-${p.id}`,
      grupo: "editar",
      rotulo: `${p.empresa} · ${p.tituloProjeto}`,
      executar: () => navegador.push(`/admin/${p.id}`),
    })),
    ...propostas.map((p) => ({
      id: `link-${p.id}`,
      grupo: "copiar link",
      rotulo: p.empresa,
      executar: () => {
        navigator.clipboard?.writeText(`${base}/${p.caminho}`);
      },
    })),
  ];

  return (
    <>
      <Comando itens={comandos} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-0 flex-1 items-center">
          <span className="sr-only">Buscar proposta</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por empresa, projeto ou endereço"
            className="campo-mesa pr-16"
          />
          <span
            aria-hidden
            className="tecla-mesa pointer-events-none absolute right-3"
            title="Abrir a paleta de comando"
          >
            ⌘K
          </span>
        </label>

        {arquivadas > 0 && (
          <button
            type="button"
            onClick={() => setMostrarArquivadas((v) => !v)}
            className="botao-mesa"
            aria-pressed={mostrarArquivadas}
          >
            {mostrarArquivadas ? "Esconder" : "Ver"} arquivadas ({arquivadas})
          </button>
        )}
      </div>

      {visiveis.length === 0 && (
        <p className="painel-mesa mt-6 p-10 text-center leading-relaxed text-[var(--mesa-tinta-suave)]">
          {busca
            ? `Nada casa com "${busca}".`
            : "Nenhuma proposta ainda. Comece por Nova proposta: suporte, pagamento, cancelamento, indicação e custos já vêm escritos."}
        </p>
      )}

      <ul className="mt-6 flex flex-col">
        {visiveis.map((p, i) => (
          <li
            key={p.id}
            className="group border-t border-[var(--mesa-fio)] py-6 last:border-b"
          >
            <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
              <span
                aria-hidden
                className="numeral-mesa hidden w-14 shrink-0 text-[2.5rem] text-[var(--mesa-fio-forte)] transition-colors group-hover:text-[var(--mesa-acento)] sm:block"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/${p.id}`}
                  /* `min-h-11`: no celular este é o alvo principal da linha, e alvo de
                     toque menor que 44px é o defeito que mais irrita em lista. */
                  className="titulo-mesa flex min-h-11 items-center truncate text-[clamp(1.5rem,4vw,2rem)] text-[var(--mesa-tinta)] hover:text-[var(--mesa-acento)]"
                >
                  {p.empresa}
                </Link>

                <p className="mt-1 truncate text-[var(--mesa-tinta-suave)]">
                  {p.tituloProjeto}
                </p>

                <p className="etiqueta-mesa mt-3 truncate">
                  /{p.caminho} · válida até {p.validaAte.split("-").reverse().join("/")}
                </p>

                <div className="mt-4">
                  <TrilhaDeStatus status={p.status} />
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Link href={`/admin/${p.id}`} className="botao-mesa botao-mesa-forte">
                  Editar
                </Link>
                <a
                  href={`/${p.caminho}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="botao-mesa"
                >
                  Abrir
                </a>
                <BotaoCopiar texto={`${base}/${p.caminho}`} />

                <form action={duplicar}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="botao-mesa">
                    Duplicar
                  </button>
                </form>

                <form action={mudarStatus}>
                  <input type="hidden" name="id" value={p.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={p.status === "arquivada" ? "rascunho" : "arquivada"}
                  />
                  <button type="submit" className="botao-mesa">
                    {p.status === "arquivada" ? "Desarquivar" : "Arquivar"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
