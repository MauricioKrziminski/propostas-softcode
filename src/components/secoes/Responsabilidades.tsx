import { Secao } from "@/components/ui/Secao";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Responsabilidades as Dados } from "@/lib/proposta/schema";

/**
 * "O que precisamos de você" — seção reaproveitada dos orçamentos em PDF que a
 * SoftCode já envia, onde ela aparece como "O que precisamos da Barba Log".
 *
 * Vale a pena por um motivo comercial: quase todo atraso de projeto começa aqui,
 * e deixar isso escrito na proposta muda a conversa de "vocês atrasaram" para
 * "faltou o material que combinamos".
 */
export function Responsabilidades({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="responsabilidades"
      etiqueta="08"
      titulo={dados.titulo ?? "O que precisamos de você"}
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-10 text-lg leading-relaxed text-neblina">
          {dados.introducao}
        </Revelar>
      )}

      <ListaRevelada como="ul" className="grid gap-px sm:grid-cols-2">
        {dados.itens.map((it, i) => (
          <ItemRevelado
            key={i}
            como="li"
            className="cartao-luz bg-elevado/40 p-5 outline outline-linha"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="numero mt-0.5 shrink-0 text-xs text-acento"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-osso">{it.item}</p>
                {it.detalhe && (
                  <p className="mt-1.5 text-sm text-neblina">{it.detalhe}</p>
                )}
              </div>
            </div>
          </ItemRevelado>
        ))}
      </ListaRevelada>

      {dados.nota && (
        <Revelar como="p" className="mt-8 text-sm text-neblina">
          {dados.nota}
        </Revelar>
      )}
    </Secao>
  );
}
