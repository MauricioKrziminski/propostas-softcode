"use client";

import { useState } from "react";
import { Secao } from "@/components/ui/Secao";
import { Botao } from "@/components/ui/Botao";
import { formatarValor } from "@/lib/proposta/formatar";
import { linkEmail } from "@/lib/contato";
import type { Aceite as Dados, OpcaoInvestimento } from "@/lib/proposta/schema";

/**
 * FASE 1: sem banco, o aceite abre o e-mail já preenchido com a opção escolhida.
 * FASE 2: esta MESMA interface passa a chamar a Server Action que grava
 * timestamp, IP, user-agent e `opcao_id` — nada aqui precisa ser redesenhado.
 *
 * O aviso de registro fica visível junto ao botão, no fluxo, e não atrás de um
 * link: ele é o que dá validade ao aceite, não um disclaimer defensivo.
 */
export function Aceite({
  dados,
  opcoes,
  empresa,
  projeto,
}: {
  dados: Dados;
  opcoes: OpcaoInvestimento[];
  empresa: string;
  projeto: string;
}) {
  const [escolhida, setEscolhida] = useState<string | null>(
    opcoes.find((o) => o.destaque)?.id ?? (opcoes.length === 1 ? opcoes[0].id : null),
  );

  const opcao = opcoes.find((o) => o.id === escolhida);

  const corpo = [
    `Olá, aqui é da ${empresa}.`,
    "",
    `Aceitamos a proposta "${projeto}"`,
    opcao ? `Opção escolhida: ${opcao.nome} — ${formatarValor(opcao.valorCentavos)}` : "",
    "",
    "Podem seguir com o contrato.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Secao
      id="aceite"
      etiqueta="09"
      titulo={dados.titulo ?? "Aceite"}
      largura="ampla"
      ritmo="respiro"
    >
      {dados.texto && (
        <p className="mb-8 max-w-3xl text-lg leading-relaxed text-neblina">
          {dados.texto}
        </p>
      )}

      {opcoes.length > 1 && (
        <fieldset className="mb-8">
          <legend className="mb-4 text-xs uppercase tracking-[0.2em] text-acento">
            Escolha a opção
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {opcoes.map((o) => (
              <label
                key={o.id}
                className={`alvo-toque flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-200 motion-reduce:transition-none ${
                  escolhida === o.id
                    ? "border-acento bg-superficie"
                    : "border-linha hover:border-neblina"
                }`}
              >
                <input
                  type="radio"
                  name="opcao"
                  value={o.id}
                  checked={escolhida === o.id}
                  onChange={() => setEscolhida(o.id)}
                  className="mt-1 accent-[#c79a3b]"
                />
                <span>
                  <span className="block text-osso">{o.nome}</span>
                  <span className="numero mt-1 block text-sm text-neblina">
                    {formatarValor(o.valorCentavos)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Aviso LGPD: reforço da validade do registro, sempre visível. */}
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-neblina">
        <strong className="text-osso">
          Ao confirmar, registramos data, hora, endereço IP e navegador.
        </strong>{" "}
        É esse registro que dá validade jurídica ao seu aceite — ele cumpre o
        papel da assinatura no PDF, sem precisar imprimir nada.
      </p>

      <div className="flex flex-wrap gap-4">
        <a
          href={linkEmail(`Aceite da proposta — ${empresa}`, corpo)}
          aria-disabled={!opcao}
          className={`alvo-toque inline-flex items-center justify-center gap-2 px-6 py-3 text-sm uppercase tracking-[0.12em] transition-colors duration-200 motion-reduce:transition-none ${
            opcao
              ? "bg-acento text-fundo hover:bg-osso"
              : "pointer-events-none bg-linha text-neblina"
          }`}
        >
          {opcao ? `Aceitar — ${opcao.nome}` : "Escolha uma opção acima"}
        </a>

        {dados.mostrarPdf && (
          <Botao
            variante="contorno"
            className="so-tela"
            onClick={() => window.print()}
          >
            Baixar em PDF
          </Botao>
        )}
      </div>
    </Secao>
  );
}
