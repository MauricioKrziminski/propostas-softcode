import Link from "next/link";
import { headers } from "next/headers";

import { BarraDaMesa } from "@/components/admin/BarraDaMesa";
import { FormularioDeEntrada } from "@/components/admin/FormularioDeEntrada";
import { ListaDePropostas } from "@/components/admin/ListaDePropostas";
import { sessaoValida } from "@/lib/admin/sessao";
import { listarPropostas } from "@/lib/proposta/repositorio";

/** A lista é sempre fresca: proposta salva agora precisa aparecer agora. */
export const dynamic = "force-dynamic";

/**
 * `/painel` é a porta E a sala.
 *
 * Antes existia `/painel/entrar` só para o campo de senha, com um
 * redirecionamento para lá e outro de volta. Uma rota inteira para uma
 * pergunta, e um endereço a mais para lembrar. Agora é a MESMA página: sem
 * sessão ela mostra a entrada, com sessão mostra as propostas. Quem entra
 * continua no endereço em que estava, e quem sai também.
 */
export default async function PaginaPainel() {
  if (!(await sessaoValida())) return <Entrada />;

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
          <Link href="/painel/nova" className="botao-mesa botao-mesa-forte">
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

/**
 * A porta. O texto diz o que é isto sem dizer o que tem dentro: quem chegou por
 * engano entende que errou o endereço, e quem chegou procurando não descobre
 * nada.
 */
function Entrada() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="etiqueta-mesa">SoftCode</p>

      <h1 className="titulo-mesa mt-4 text-[clamp(2.5rem,9vw,3.5rem)] text-[var(--mesa-tinta)]">
        Mesa de propostas
      </h1>

      <p className="mt-4 max-w-sm leading-relaxed text-[var(--mesa-tinta-suave)]">
        Aqui as propostas são montadas, revistas e enviadas. Área interna: se você chegou
        por engano, não há nada nesta página para você.
      </p>

      <FormularioDeEntrada />

      <p className="etiqueta-mesa mt-12">propostas.softcodedev.com.br</p>
    </main>
  );
}
