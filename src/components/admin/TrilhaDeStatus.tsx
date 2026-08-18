import { STATUS_PROPOSTA } from "@/lib/proposta/schema";

/**
 * O status como CAMINHO, não como etiqueta.
 *
 * "Rascunho", "enviada" e "aceita" não são categorias soltas: são três pontos de
 * uma linha que a proposta percorre. Desenhar assim responde de relance a
 * pergunta que a etiqueta não responde, que é "em que pé isso está".
 *
 * "Arquivada" fica fora da trilha de propósito: ela não é um estágio adiante,
 * é uma saída lateral.
 */
const TRILHA = STATUS_PROPOSTA.filter((s) => s !== "arquivada");

export function TrilhaDeStatus({ status }: { status: string }) {
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
    <span className="flex items-center gap-2" aria-label={`Status: ${status}`}>
      {TRILHA.map((passo, i) => {
        const percorrido = i <= atual;
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
            <span
              className={`etiqueta-mesa flex items-center gap-1.5 ${
                i === atual
                  ? "text-[var(--mesa-acento)]"
                  : percorrido
                    ? "text-[var(--mesa-tinta-suave)]"
                    : "text-[var(--mesa-tinta-apagada)] opacity-60"
              }`}
            >
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
            </span>
          </span>
        );
      })}
    </span>
  );
}
