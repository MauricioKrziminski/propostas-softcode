import { redirect } from "next/navigation";

import { sessaoValida } from "@/lib/admin/sessao";
import { FormularioDeEntrada } from "@/components/admin/FormularioDeEntrada";

/**
 * A porta. É a única rota do painel que o proxy deixa passar sem cookie, senão
 * quem não está logado ficaria preso num redirecionamento para ela mesma.
 *
 * O texto diz o que é isto sem dizer o que tem dentro: quem chegou por engano
 * entende que errou o endereço, e quem chegou procurando não descobre nada.
 */
export default async function PaginaEntrar() {
  if (await sessaoValida()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="etiqueta-mesa">SoftCode</p>

      <h1 className="titulo-mesa mt-4 text-[clamp(2.5rem,9vw,3.5rem)] text-[var(--mesa-tinta)]">
        Mesa de propostas
      </h1>

      <p className="mt-4 max-w-sm leading-relaxed text-[var(--mesa-tinta-suave)]">
        Aqui as propostas são montadas, revistas e enviadas. Área interna: se você chegou por
        engano, não há nada nesta página para você.
      </p>

      <FormularioDeEntrada />

      <p className="etiqueta-mesa mt-12">
        propostas.softcodedev.com.br
      </p>
    </main>
  );
}
