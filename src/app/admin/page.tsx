import Link from "next/link";
import { headers } from "next/headers";

import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { BotaoCopiar } from "@/components/admin/BotaoCopiar";
import { exigirAdmin } from "@/lib/admin/guarda";
import { listarPropostas } from "@/lib/proposta/repositorio";
import { estaExpirada, formatarDataLonga } from "@/lib/proposta/formatar";
import { duplicar, mudarStatus } from "./acoes";

/** A lista é sempre fresca: proposta salva agora precisa aparecer agora. */
export const dynamic = "force-dynamic";

const CORES_STATUS: Record<string, string> = {
  rascunho: "bg-elevado text-neblina",
  enviada: "bg-superficie text-acento",
  aceita: "bg-acento text-osso",
  arquivada: "bg-elevado text-neblina line-through",
};

export default async function PaginaLista() {
  await exigirAdmin();

  const [propostas, cabecalhos] = await Promise.all([listarPropostas(), headers()]);
  const base = `${cabecalhos.get("x-forwarded-proto") ?? "http"}://${cabecalhos.get("host")}`;

  return (
    <>
      <CabecalhoAdmin titulo={`${propostas.length} proposta(s)`} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-navy">Suas propostas</h1>
          <Link
            href="/admin/nova"
            className="flex min-h-11 items-center rounded-lg bg-acento px-5 font-medium text-osso"
          >
            Nova proposta
          </Link>
        </div>

        {propostas.length === 0 && (
          <p className="mt-10 rounded-xl border border-dashed border-linha bg-fundo p-8 text-center text-neblina">
            Nenhuma proposta ainda. Comece por &ldquo;Nova proposta&rdquo;: o texto que se repete
            em todo orçamento já vem preenchido.
          </p>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {propostas.map((p) => {
            const vencida = estaExpirada(p.validaAte);
            return (
              <li
                key={p.id}
                className="rounded-xl border border-linha bg-fundo p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/${p.id}`}
                      className="font-display text-lg font-bold text-navy hover:text-acento"
                    >
                      {p.empresa}
                    </Link>
                    <p className="text-sm text-neblina">{p.tituloProjeto}</p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${
                      CORES_STATUS[p.status] ?? CORES_STATUS.rascunho
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-neblina">
                  {vencida ? "Venceu em " : "Válida até "}
                  <span className={vencida ? "text-acento" : ""}>
                    {formatarDataLonga(p.validaAte)}
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/${p.id}`}
                    className="flex min-h-11 items-center rounded-lg border border-linha px-4 text-sm hover:border-acento hover:text-acento"
                  >
                    Editar
                  </Link>
                  <a
                    href={`/${p.caminho}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center rounded-lg border border-linha px-4 text-sm hover:border-acento hover:text-acento"
                  >
                    Abrir
                  </a>
                  <BotaoCopiar texto={`${base}/${p.caminho}`} />

                  <form action={duplicar}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="flex min-h-11 items-center rounded-lg border border-linha px-4 text-sm hover:border-acento hover:text-acento"
                    >
                      Duplicar
                    </button>
                  </form>

                  <form action={mudarStatus} className="flex items-center">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={p.status === "arquivada" ? "rascunho" : "arquivada"}
                    />
                    <button
                      type="submit"
                      className="flex min-h-11 items-center rounded-lg border border-linha px-4 text-sm text-neblina hover:border-acento hover:text-acento"
                    >
                      {p.status === "arquivada" ? "Desarquivar" : "Arquivar"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
