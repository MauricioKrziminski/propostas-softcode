"use client";

import { useState } from "react";
import { Secao } from "@/components/ui/Secao";
import { BotaoLink } from "@/components/ui/Botao";
import { formatarValor, rotulo } from "@/lib/proposta/formatar";
import { linkEmail } from "@/lib/contato";
import type { Aceite as Dados, OpcaoInvestimento } from "@/lib/proposta/schema";

/**
 * Capítulo NOITE, a página abre e encerra no mesmo registro, e o CTA final
 * ganha o tratamento mais forte da peça: vidro, borda metálica girando e
 * varredura de brilho no hover.
 *
 * FASE 1: sem banco, o aceite abre o e-mail já preenchido com a opção escolhida.
 * FASE 2: esta MESMA interface passa a chamar a Server Action que grava
 * timestamp, IP, user-agent e `opcao_id`, nada aqui precisa ser redesenhado.
 *
 * O aviso de registro fica no fluxo, acima do botão, e não atrás de um link: é
 * ele que dá validade ao aceite, não um disclaimer defensivo.
 */
export function Aceite({
  dados,
  opcoes,
  empresa,
  projeto,
  numero,
  caminho,
}: {
  dados: Dados;
  opcoes: OpcaoInvestimento[];
  empresa: string;
  projeto: string;
  numero: number;
  caminho: string;
}) {
  const [escolhida, setEscolhida] = useState<string | null>(
    opcoes.find((o) => o.destaque)?.id ?? (opcoes.length === 1 ? opcoes[0].id : null),
  );

  const opcao = opcoes.find((o) => o.id === escolhida);

  const corpo = [
    `Olá, aqui é da ${empresa}.`,
    "",
    `Aceitamos a proposta "${projeto}"`,
    opcao ? `Opção escolhida: ${opcao.nome} (${formatarValor(opcao.valorCentavos)})` : "",
    "",
    "Podem seguir com o contrato.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Secao
      id="aceite"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Aceite"}
      largura="ampla"
      ritmo="respiro"
    >
      {dados.texto && (
        <p className="mb-12 max-w-3xl text-destaque leading-relaxed text-noite-neblina">
          {dados.texto}
        </p>
      )}

      <div className="vidro p-7 sm:p-12">
        {opcoes.length > 1 && (
          <fieldset className="mb-10">
            <legend className="tipo-mono mb-5 text-miudo uppercase tracking-[0.28em] text-acento-noite">
              Escolha a opção
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {opcoes.map((o) => (
                <label
                  key={o.id}
                  className={`alvo-toque flex cursor-pointer items-start gap-3 rounded-xl border p-5 transition-colors duration-200 motion-reduce:transition-none ${
                    escolhida === o.id
                      ? "border-acento-noite bg-noite-elevada"
                      : "border-noite-linha hover:border-noite-neblina"
                  }`}
                >
                  <input
                    type="radio"
                    name="opcao"
                    value={o.id}
                    checked={escolhida === o.id}
                    onChange={() => setEscolhida(o.id)}
                    className="mt-1 accent-[var(--color-acento-noite)]"
                  />
                  <span>
                    <span className="block text-noite-texto">{o.nome}</span>
                    <span className="tipo-mono mt-1 block text-sm text-noite-neblina">
                      {formatarValor(o.valorCentavos)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Aviso LGPD: reforço da validade do registro, sempre visível. */}
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-noite-neblina">
          <strong className="text-noite-texto">
            Ao confirmar, registramos data, hora, endereço IP e navegador.
          </strong>{" "}
          É esse registro que dá validade jurídica ao seu aceite: ele cumpre o
          papel da assinatura no PDF, sem precisar imprimir nada.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href={linkEmail(`Aceite da proposta: ${empresa}`, corpo)}
            aria-disabled={!opcao}
            className={`alvo-toque varredura relative inline-flex items-center justify-center overflow-hidden rounded-full px-9 py-4 text-sm uppercase tracking-[0.14em] transition-colors duration-200 motion-reduce:transition-none ${
              opcao
                ? "borda-metal bg-acento-noite text-noite hover:bg-noite-texto"
                : "pointer-events-none bg-noite-linha text-noite-neblina"
            }`}
          >
            {opcao ? `Aceitar: ${opcao.nome}` : "Escolha uma opção acima"}
          </a>

          {dados.mostrarPdf && (
            /* Vai para o PDF gerado no servidor, não para o `window.print()`.
               O documento impresso é uma peça própria, capa, numeração de
               página e bloco de assinatura, e não uma captura da tela. */
            <BotaoLink
              href={`/${caminho}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="so-tela border-noite-linha text-noite-texto hover:border-acento-noite hover:text-acento-noite"
            >
              Baixar em PDF
            </BotaoLink>
          )}
        </div>
      </div>
    </Secao>
  );
}
