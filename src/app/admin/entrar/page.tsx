import { redirect } from "next/navigation";

import { sessaoValida } from "@/lib/admin/sessao";
import { FormularioDeEntrada } from "@/components/admin/FormularioDeEntrada";

/**
 * Tela de entrada. É a única rota do admin que o proxy deixa passar sem cookie,
 * senão quem não está logado ficaria preso num redirecionamento para ela mesma.
 */
export default async function PaginaEntrar() {
  if (await sessaoValida()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-navy">Painel de propostas</h1>
      <p className="mt-2 text-sm text-neblina">
        Área interna da SoftCode. Só quem monta proposta entra aqui.
      </p>
      <FormularioDeEntrada />
    </main>
  );
}
