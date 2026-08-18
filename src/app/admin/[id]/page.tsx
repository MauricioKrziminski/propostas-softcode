import { notFound } from "next/navigation";

import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { EditorDaProposta } from "@/components/admin/EditorDaProposta";
import { EditorDeCabecalho } from "@/components/admin/EditorDeCabecalho";
import { exigirAdmin } from "@/lib/admin/guarda";
import { buscarPropostaPorId } from "@/lib/proposta/repositorio";
import { formatarDataLonga } from "@/lib/proposta/formatar";

export const dynamic = "force-dynamic";

export default async function PaginaEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();

  const { id } = await params;
  const proposta = await buscarPropostaPorId(id);
  if (!proposta) notFound();

  return (
    <>
      <CabecalhoAdmin titulo={proposta.cliente.empresa} voltar />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-navy">
          {proposta.cliente.empresa}
        </h1>
        <p className="mt-1 text-sm text-neblina">
          {proposta.tituloProjeto} · válida até {formatarDataLonga(proposta.validaAte)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/${proposta.caminho}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-lg border border-linha bg-fundo px-4 text-sm hover:border-acento hover:text-acento"
          >
            Ver a proposta
          </a>
          <a
            href={`/${proposta.caminho}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-lg border border-linha bg-fundo px-4 text-sm hover:border-acento hover:text-acento"
          >
            Ver o PDF
          </a>
        </div>

        <div className="mt-8">
          <EditorDeCabecalho
            id={proposta.id}
            inicial={{
              empresa: proposta.cliente.empresa,
              contato: proposta.cliente.nome,
              email: proposta.cliente.email ?? "",
              logoUrl: proposta.cliente.logoUrl ?? "",
              tituloProjeto: proposta.tituloProjeto,
              status: proposta.status,
              emitidaEm: proposta.emitidaEm,
              validaAte: proposta.validaAte,
            }}
          />
        </div>

        <h2 className="mt-10 font-display text-lg font-bold text-navy">Seções</h2>
        <p className="mt-1 text-sm leading-relaxed text-neblina">
          A ordem aqui é a ordem que o cliente lê. Seção sem conteúdo simplesmente não
          aparece na página nem no PDF.
        </p>

        <EditorDaProposta id={proposta.id} conteudoInicial={proposta.conteudo} />
      </main>
    </>
  );
}
