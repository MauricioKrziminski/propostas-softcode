"use client";

import { useState } from "react";

import type { Prontidao as Avaliacao } from "@/lib/proposta/prontidao";

/**
 * O medidor de prontidão.
 *
 * A barra responde de relance a única pergunta que importa antes de mandar o
 * link: "isso está inteiro?". Clicar numa pendência salta direto para a seção
 * que a resolve, que é o que separa um aviso útil de um aviso que só reclama.
 *
 * Ele reflete o que está SALVO, não o que está sendo digitado. É proposital: o
 * que vale é o que o cliente receberia se o link fosse enviado agora.
 */
export function Prontidao({
  avaliacao,
  aoSaltar,
}: {
  avaliacao: Avaliacao;
  aoSaltar: (secao: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const { pendencias, cumpridas, total, podeEnviar } = avaliacao;
  const impedimentos = pendencias.filter((p) => p.gravidade === "impede").length;

  return (
    <div className="painel-mesa overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex min-h-11 w-full items-center gap-4 px-4 py-3 text-left"
      >
        <span className="etiqueta-mesa shrink-0">prontidão</span>

        {/* Uma marca por verificação: cheia quando passou, vazia quando falta.
            Barra segmentada conta melhor que porcentagem, porque o número que
            interessa é "quantas coisas faltam", não "quantos por cento". */}
        <span aria-hidden className="flex min-w-0 flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < cumpridas
                  ? podeEnviar
                    ? "bg-[var(--mesa-ok)]"
                    : "bg-[var(--mesa-acento)]"
                  : impedimentos > 0
                    ? "bg-[var(--mesa-aviso)]"
                    : "bg-[var(--mesa-fio-forte)]"
              }`}
            />
          ))}
        </span>

        <span className="shrink-0 text-sm text-[var(--mesa-tinta-suave)]">
          {pendencias.length === 0
            ? "pronta para enviar"
            : `${pendencias.length} pendência(s)`}
        </span>
        <span aria-hidden className="etiqueta-mesa shrink-0">
          {aberto ? "−" : "+"}
        </span>
      </button>

      {aberto && pendencias.length > 0 && (
        <ul className="border-t border-[var(--mesa-fio)]">
          {pendencias.map((p) => (
            <li key={p.id} className="border-b border-[var(--mesa-fio)] last:border-b-0">
              <button
                type="button"
                onClick={() => p.secao && aoSaltar(p.secao)}
                className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--mesa-tinta-suave)] hover:text-[var(--mesa-tinta)]"
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    p.gravidade === "impede"
                      ? "bg-[var(--mesa-aviso)]"
                      : "bg-[var(--mesa-fio-forte)]"
                  }`}
                />
                {p.texto}
                {p.secao && (
                  <span aria-hidden className="etiqueta-mesa ml-auto shrink-0">
                    ir ↗
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && pendencias.length === 0 && (
        <p className="border-t border-[var(--mesa-fio)] px-4 py-4 text-sm text-[var(--mesa-tinta-suave)]">
          Nada pendente. Copie o link e mande.
        </p>
      )}
    </div>
  );
}
