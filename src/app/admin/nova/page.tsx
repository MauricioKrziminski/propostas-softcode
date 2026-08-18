import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { FormularioNovaProposta } from "@/components/admin/FormularioNovaProposta";
import { exigirAdmin } from "@/lib/admin/guarda";

export default async function PaginaNova() {
  await exigirAdmin();

  /* Validade padrão: 30 dias. É o prazo que os orçamentos da SoftCode já usavam,
     e é curto o bastante para o valor não envelhecer. */
  const daquiATrintaDias = new Date();
  daquiATrintaDias.setDate(daquiATrintaDias.getDate() + 30);

  return (
    <>
      <CabecalhoAdmin titulo="Nova proposta" voltar />

      <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-navy">Nova proposta</h1>
        <p className="mt-2 text-sm leading-relaxed text-neblina">
          Só o que muda de cliente para cliente. Suporte, pagamento, cancelamento, indicação,
          custos e o texto sobre a SoftCode já entram preenchidos, e você ajusta na tela
          seguinte se precisar.
        </p>

        <FormularioNovaProposta
          validadePadrao={daquiATrintaDias.toISOString().slice(0, 10)}
        />
      </main>
    </>
  );
}
