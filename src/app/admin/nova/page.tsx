import { BarraDaMesa } from "@/components/admin/BarraDaMesa";
import { FormularioNovaProposta } from "@/components/admin/FormularioNovaProposta";
import { exigirAdmin } from "@/lib/admin/guarda";
import { SECOES_DO_CLIENTE } from "@/lib/proposta/modelo";

export default async function PaginaNova() {
  await exigirAdmin();

  /* Validade padrão: 30 dias. É o prazo que os orçamentos da SoftCode já usavam,
     curto o bastante para o valor não envelhecer. */
  const daquiATrintaDias = new Date();
  daquiATrintaDias.setDate(daquiATrintaDias.getDate() + 30);

  return (
    <>
      <BarraDaMesa
        caminho={[{ rotulo: "propostas", href: "/admin" }, { rotulo: "nova" }]}
      />

      <main className="mx-auto grid w-full max-w-[1100px] gap-12 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="etiqueta-mesa">começar</p>
          <h1 className="titulo-mesa mt-3 text-[clamp(2.25rem,7vw,3.25rem)] text-[var(--mesa-tinta)]">
            Nova proposta
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-[var(--mesa-tinta-suave)]">
            Só o que muda de cliente para cliente. O resto já entra escrito e você ajusta na
            mesa, se precisar.
          </p>

          <FormularioNovaProposta
            validadePadrao={daquiATrintaDias.toISOString().slice(0, 10)}
          />
        </div>

        {/* O que vem pronto, dito antes de a pessoa perguntar. É o que transforma
            "só cinco campos?" em "ah, o resto já está lá". */}
        <aside className="painel-mesa h-fit p-6">
          <p className="etiqueta-mesa">já vem preenchido</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-[var(--mesa-tinta-suave)]">
            {[
              "Como trabalhamos",
              "O que precisamos de você",
              "Suporte após a entrega",
              "Investimento (sem valor)",
              "Como o pagamento funciona",
              "Custos que não estão no valor",
              "Fora do escopo",
              "Programa de indicação",
              "Sobre a SoftCode",
              "Considerações finais",
              "Aceite",
            ].map((secao) => (
              <li key={secao} className="flex items-baseline gap-2">
                <span aria-hidden className="h-px w-3 shrink-0 bg-[var(--mesa-acento)]" />
                {secao}
              </li>
            ))}
          </ul>

          <p className="etiqueta-mesa mt-6">você escreve</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-[var(--mesa-tinta)]">
            {SECOES_DO_CLIENTE.map((secao) => (
              <li key={secao} className="flex items-baseline gap-2">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mesa-aviso)]"
                />
                {secao === "solucao" ? "solução" : secao}
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </>
  );
}
