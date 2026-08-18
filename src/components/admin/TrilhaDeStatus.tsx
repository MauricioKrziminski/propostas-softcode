"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { definirStatus } from "@/app/admin/acoes";
import { STATUS_PROPOSTA } from "@/lib/proposta/schema";

/**
 * O status como CAMINHO, e como CONTROLE.
 *
 * "Rascunho", "enviada" e "aceita" não são categorias soltas: são três pontos de
 * uma linha que a proposta percorre. Desenhar assim responde de relance a
 * pergunta que uma etiqueta não responde, que é "em que pé isso está".
 *
 * E a trilha é clicável. Antes, marcar uma proposta como enviada exigia abrir o
 * editor, achar a capa, mexer num campo de seleção e salvar: quatro passos para
 * a ação mais frequente do painel, que acontece toda vez que um link vai para o
 * WhatsApp. Agora é um clique, no lugar onde o status já estava sendo mostrado.
 *
 * "Arquivada" fica fora da trilha de propósito: não é um estágio adiante, é uma
 * saída lateral.
 */
const TRILHA = STATUS_PROPOSTA.filter((s) => s !== "arquivada");

export function TrilhaDeStatus({
  status,
  id,
}: {
  status: string;
  /** Sem `id` a trilha é só leitura, que é como ela aparece em lista impressa. */
  id?: string;
}) {
  const [mudando, iniciarTransicao] = useTransition();
  const navegador = useRouter();

  function trocar(novo: string) {
    if (!id || novo === status) return;
    iniciarTransicao(async () => {
      await definirStatus(id, novo);
      navegador.refresh();
    });
  }

  if (status === "arquivada") {
    return (
      <span className="etiqueta-mesa inline-flex items-center gap-2 text-[var(--mesa-tinta-apagada)]">
        <span aria-hidden className="h-px w-6 bg-[var(--mesa-fio-forte)]" />
        arquivada
      </span>
    );
  }

  const atual = Math.max(0, TRILHA.indexOf(status as (typeof TRILHA)[number]));

  return (
    <span
      className={`flex items-center gap-2 ${mudando ? "opacity-60" : ""}`}
      aria-label={`Status: ${status}`}
    >
      {TRILHA.map((passo, i) => {
        const percorrido = i <= atual;
        const cor =
          i === atual
            ? "text-[var(--mesa-acento)]"
            : percorrido
              ? "text-[var(--mesa-tinta-suave)]"
              : "text-[var(--mesa-tinta-apagada)] opacity-60";

        const miolo = (
          <>
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                i === atual
                  ? "bg-[var(--mesa-acento)]"
                  : percorrido
                    ? "bg-[var(--mesa-tinta-suave)]"
                    : "bg-[var(--mesa-fio-forte)]"
              }`}
            />
            {passo}
          </>
        );

        return (
          <span key={passo} className="flex items-center gap-2">
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px w-5 ${
                  percorrido ? "bg-[var(--mesa-acento)]" : "bg-[var(--mesa-fio)]"
                }`}
              />
            )}

            {id ? (
              <button
                type="button"
                onClick={() => trocar(passo)}
                disabled={mudando || i === atual}
                title={i === atual ? `Já está ${passo}` : `Marcar como ${passo}`}
                className={`etiqueta-mesa flex min-h-11 items-center gap-1.5 px-1 hover:text-[var(--mesa-tinta)] disabled:hover:text-current ${cor}`}
              >
                {miolo}
              </button>
            ) : (
              <span className={`etiqueta-mesa flex items-center gap-1.5 ${cor}`}>{miolo}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
