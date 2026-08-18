"use client";

import { useState, useTransition } from "react";

import { salvarSecaoDaProposta } from "@/app/admin/acoes";
import { CHAVES_SECAO, type ChaveSecao, type Conteudo } from "@/lib/proposta/schema";
import { SECOES, podar } from "./secoes";

/**
 * O editor da proposta, seção por seção.
 *
 * Salvar é POR SEÇÃO, não a página inteira. Duas razões: a proposta cheia passa
 * de 20KB de JSON e mandar tudo a cada ajuste é desperdício; e, mais importante,
 * um erro de validação numa seção não pode impedir de salvar outra. Quem monta
 * proposta preenche fora de ordem.
 *
 * O estado vive aqui, no navegador, e só sobe quando você clica em salvar. Nada
 * de salvamento automático: proposta é documento comercial, e gravar sozinho
 * enquanto a pessoa pensa é como se perde uma versão boa.
 */
type EstadoDaSecao = { salvando?: boolean; salvo?: boolean; erros?: string[] };

export function EditorDaProposta({
  id,
  conteudoInicial,
}: {
  id: string;
  conteudoInicial: Conteudo;
}) {
  const [conteudo, setConteudo] = useState<Record<string, unknown>>(
    conteudoInicial as Record<string, unknown>,
  );
  const [estados, setEstados] = useState<Record<string, EstadoDaSecao>>({});
  const [, iniciarTransicao] = useTransition();

  const marcar = (chave: string, estado: EstadoDaSecao) =>
    setEstados((atual) => ({ ...atual, [chave]: estado }));

  function salvar(chave: ChaveSecao) {
    marcar(chave, { salvando: true });
    iniciarTransicao(async () => {
      const resposta = await salvarSecaoDaProposta(id, chave, podar(conteudo[chave]));
      marcar(chave, resposta.erros ? { erros: resposta.erros } : { salvo: true });
    });
  }

  function remover(chave: ChaveSecao) {
    marcar(chave, { salvando: true });
    iniciarTransicao(async () => {
      await salvarSecaoDaProposta(id, chave, undefined);
      setConteudo((atual) => {
        const copia = { ...atual };
        delete copia[chave];
        return copia;
      });
      marcar(chave, {});
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {CHAVES_SECAO.map((chave, indice) => {
        const definicao = SECOES[chave];
        const valor = conteudo[chave];
        const existe = valor !== undefined;
        const estado = estados[chave] ?? {};
        const Editor = definicao.Editor;

        return (
          <details
            key={chave}
            className="overflow-hidden rounded-xl border border-linha bg-fundo"
          >
            <summary className="flex min-h-14 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span className="font-mono text-xs text-neblina">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-base font-bold text-navy">
                {definicao.rotulo}
              </span>
              <span className="hidden text-sm text-neblina sm:inline">
                {definicao.resumo}
              </span>

              <span className="ml-auto text-xs">
                {existe ? (
                  <span className="text-neblina">preenchida</span>
                ) : definicao.doCliente ? (
                  <span className="text-acento">falta preencher</span>
                ) : (
                  <span className="text-neblina">fora da proposta</span>
                )}
              </span>
            </summary>

            <div className="border-t border-linha px-4 py-5">
              {!existe && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm leading-relaxed text-neblina">
                    Esta seção não está na proposta e não vai aparecer para o cliente.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setConteudo((atual) => ({ ...atual, [chave]: definicao.padrao() }))
                    }
                    className="min-h-11 w-fit rounded-lg border border-linha px-4 text-sm hover:border-acento hover:text-acento"
                  >
                    Adicionar seção
                  </button>
                </div>
              )}

              {existe && (
                <>
                  <div className="flex flex-col gap-5">
                    <Editor
                      valor={valor as never}
                      aoMudar={(novo: unknown) => {
                        setConteudo((atual) => ({ ...atual, [chave]: novo }));
                        marcar(chave, {});
                      }}
                    />
                  </div>

                  {estado.erros && (
                    <ul role="alert" className="mt-4 flex flex-col gap-1">
                      {estado.erros.map((erro, i) => (
                        <li key={i} className="text-sm text-acento">
                          {erro}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => salvar(chave)}
                      disabled={estado.salvando}
                      className="min-h-11 rounded-lg bg-acento px-5 text-sm font-medium text-osso disabled:opacity-60"
                    >
                      {estado.salvando ? "Salvando..." : "Salvar seção"}
                    </button>

                    {estado.salvo && <span className="text-sm text-neblina">Salvo</span>}

                    <button
                      type="button"
                      onClick={() => remover(chave)}
                      className="ml-auto min-h-11 rounded-lg border border-linha px-4 text-sm text-neblina hover:border-acento hover:text-acento"
                    >
                      Tirar da proposta
                    </button>
                  </div>
                </>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
