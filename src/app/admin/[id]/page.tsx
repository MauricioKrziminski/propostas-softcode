import { notFound } from "next/navigation";

import { BarraDaMesa } from "@/components/admin/BarraDaMesa";
import { Mesa } from "@/components/admin/Mesa";
import { TrilhaDeStatus } from "@/components/admin/TrilhaDeStatus";
import { exigirAdmin } from "@/lib/admin/guarda";
import { buscarPropostaPorId } from "@/lib/proposta/repositorio";
import { avaliarProntidao } from "@/lib/proposta/prontidao";

export const dynamic = "force-dynamic";

export default async function PaginaDaMesa({
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
      <BarraDaMesa
        caminho={[
          { rotulo: "propostas", href: "/admin" },
          { rotulo: proposta.cliente.empresa },
        ]}
        acoes={
          <>
            <span className="hidden md:block">
              <TrilhaDeStatus status={proposta.status} id={proposta.id} />
            </span>
            <a
              href={`/${proposta.caminho}`}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-mesa hidden sm:inline-flex"
            >
              Ver proposta
            </a>
            <a
              href={`/${proposta.caminho}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="botao-mesa"
            >
              PDF
            </a>
          </>
        }
      />

      <Mesa
        id={proposta.id}
        caminho={proposta.caminho}
        conteudoInicial={proposta.conteudo}
        prontidao={avaliarProntidao(proposta)}
        cabecalhoInicial={{
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
    </>
  );
}
