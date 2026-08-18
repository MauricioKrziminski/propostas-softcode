import Link from "next/link";
import { headers } from "next/headers";

import { BarraDaMesa } from "@/components/admin/BarraDaMesa";
import { ListaDePropostas } from "@/components/admin/ListaDePropostas";
import { exigirAdmin } from "@/lib/admin/guarda";
import { listarPropostas } from "@/lib/proposta/repositorio";

/** A lista é sempre fresca: proposta salva agora precisa aparecer agora. */
export const dynamic = "force-dynamic";

export default async function PaginaLista() {
  await exigirAdmin();

  const [propostas, cabecalhos] = await Promise.all([listarPropostas(), headers()]);
  const base = `${cabecalhos.get("x-forwarded-proto") ?? "http"}://${cabecalhos.get("host")}`;

  const porStatus = propostas.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <BarraDaMesa
        caminho={[{ rotulo: "propostas" }]}
        acoes={
          <Link href="/admin/nova" className="botao-mesa botao-mesa-forte">
            Nova proposta
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="etiqueta-mesa">o que está na mesa</p>
            <h1 className="titulo-mesa mt-3 text-[clamp(2.25rem,7vw,3.5rem)] text-[var(--mesa-tinta)]">
              Propostas
            </h1>
          </div>

          {/* Contagem por status: é o resumo que responde "tenho algo parado?"
              antes de olhar a lista item por item. */}
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              ["rascunho", porStatus.rascunho ?? 0],
              ["enviadas", porStatus.enviada ?? 0],
              ["aceitas", porStatus.aceita ?? 0],
            ].map(([rotulo, quantia]) => (
              <div key={rotulo}>
                <dd className="numeral-mesa text-[2rem] text-[var(--mesa-tinta)]">
                  {String(quantia).padStart(2, "0")}
                </dd>
                <dt className="etiqueta-mesa mt-1">{rotulo}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10">
          <ListaDePropostas propostas={propostas} base={base} />
        </div>
      </main>
    </>
  );
}
