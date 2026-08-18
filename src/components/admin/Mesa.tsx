"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { salvarOrdemDasSecoes, salvarSecaoDaProposta } from "@/app/admin/acoes";
import { CHAVES_SECAO, type ChaveSecao, type Conteudo } from "@/lib/proposta/schema";
import type { Prontidao as Avaliacao } from "@/lib/proposta/prontidao";
import { Comando, type ItemDeComando } from "./Comando";
import { EditorDeCabecalho, type DadosDoCabecalho } from "./EditorDeCabecalho";
import { PreviaAoVivo } from "./PreviaAoVivo";
import { Prontidao } from "./Prontidao";
import { SECOES, podar } from "./secoes";
import { TrilhoDeSecoes, type EstadoDaSecao } from "./TrilhoDeSecoes";

/**
 * A mesa: trilho à esquerda, uma seção por vez no centro, proposta de verdade à
 * direita.
 *
 * Três decisões que mudam o uso:
 *
 *   1. UMA seção por vez, não quinze acordeões abertos. Editar proposta é
 *      trabalho de foco: a lista inteira aberta transforma qualquer ajuste numa
 *      caça ao campo certo dentro de uma página de três metros.
 *
 *   2. Salvar é POR SEÇÃO e explícito, com `⌘S`. Erro de validação numa seção
 *      não pode impedir de salvar outra, e proposta é documento comercial:
 *      gravar sozinho enquanto a pessoa pensa é como se perde uma versão boa.
 *
 *   3. O estado vive aqui, no navegador, e o servidor só vê o que foi salvo. O
 *      trilho marca com um ponto azul o que ainda não foi.
 */
type EstadoDeSalvamento = { salvando?: boolean; salvo?: boolean; erros?: string[] };

export function Mesa({
  id,
  caminho,
  conteudoInicial,
  cabecalhoInicial,
  prontidao,
}: {
  id: string;
  caminho: string;
  conteudoInicial: Conteudo;
  cabecalhoInicial: DadosDoCabecalho;
  prontidao: Avaliacao;
}) {
  const [conteudo, setConteudo] = useState<Record<string, unknown>>(
    conteudoInicial as Record<string, unknown>,
  );
  const [ordem, setOrdem] = useState<ChaveSecao[]>(
    conteudoInicial.ordem ?? [...CHAVES_SECAO],
  );
  const [sujas, setSujas] = useState<Set<string>>(new Set());
  const [salvamentos, setSalvamentos] = useState<Record<string, EstadoDeSalvamento>>({});
  const [versaoDaPrevia, setVersaoDaPrevia] = useState(0);
  const [, iniciarTransicao] = useTransition();
  const navegador = useRouter();

  /* Abre na primeira seção que falta preencher. Quem acabou de criar a proposta
     cai direto no trabalho que sobrou, em vez de na capa. */
  const [ativa, setAtiva] = useState<string>(() => {
    const pendente = [...CHAVES_SECAO].find(
      (c) => SECOES[c].doCliente && conteudoInicial[c] === undefined,
    );
    return pendente ?? "capa";
  });

  const estados = useMemo(() => {
    const mapa: Record<string, EstadoDaSecao> = {};
    for (const chave of CHAVES_SECAO) {
      mapa[chave] =
        conteudo[chave] !== undefined
          ? "preenchida"
          : SECOES[chave].doCliente
            ? "falta"
            : "fora";
    }
    return mapa;
  }, [conteudo]);

  const marcarSuja = useCallback((chave: string, suja: boolean) => {
    setSujas((atual) => {
      const copia = new Set(atual);
      if (suja) copia.add(chave);
      else copia.delete(chave);
      return copia;
    });
  }, []);

  const salvarSecao = useCallback(
    (chave: ChaveSecao) => {
      setSalvamentos((a) => ({ ...a, [chave]: { salvando: true } }));
      iniciarTransicao(async () => {
        const resposta = await salvarSecaoDaProposta(id, chave, podar(conteudo[chave]));
        if (resposta.erros) {
          setSalvamentos((a) => ({ ...a, [chave]: { erros: resposta.erros } }));
          return;
        }
        setSalvamentos((a) => ({ ...a, [chave]: { salvo: true } }));
        marcarSuja(chave, false);
        setVersaoDaPrevia((v) => v + 1);
      });
    },
    [conteudo, id, marcarSuja],
  );

  /* `⌘S` salva a seção aberta. Só dispara quando existe seção aberta e ela está
     suja: o atalho não pode virar um salvamento fantasma. */
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "s" || !(evento.metaKey || evento.ctrlKey)) return;
      evento.preventDefault();
      if (ativa !== "capa" && sujas.has(ativa)) salvarSecao(ativa as ChaveSecao);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [ativa, sujas, salvarSecao]);

  function reordenar(nova: ChaveSecao[]) {
    setOrdem(nova);
    iniciarTransicao(async () => {
      await salvarOrdemDasSecoes(id, nova);
      setVersaoDaPrevia((v) => v + 1);
    });
  }

  function removerSecao(chave: ChaveSecao) {
    setSalvamentos((a) => ({ ...a, [chave]: { salvando: true } }));
    iniciarTransicao(async () => {
      await salvarSecaoDaProposta(id, chave, undefined);
      setConteudo((atual) => {
        const copia = { ...atual };
        delete copia[chave];
        return copia;
      });
      marcarSuja(chave, false);
      setSalvamentos((a) => ({ ...a, [chave]: {} }));
      setVersaoDaPrevia((v) => v + 1);
    });
  }

  /* O que o `⌘K` oferece nesta tela: pular para qualquer seção e as ações que
     de outro jeito exigiriam achar um botão no topo. */
  const comandos: ItemDeComando[] = [
    {
      id: "capa",
      grupo: "seção",
      rotulo: "00 · Cliente e datas",
      executar: () => setAtiva("capa"),
    },
    ...ordem.map((chave, i) => ({
      id: `secao-${chave}`,
      grupo: "seção",
      rotulo: `${String(i + 1).padStart(2, "0")} · ${SECOES[chave].rotulo}`,
      executar: () => setAtiva(chave),
    })),
    {
      id: "salvar",
      grupo: "ação",
      rotulo: "Salvar a seção aberta",
      atalho: "⌘S",
      executar: () => {
        if (ativa !== "capa") salvarSecao(ativa as ChaveSecao);
      },
    },
    {
      id: "copiar",
      grupo: "ação",
      rotulo: "Copiar o link da proposta",
      executar: () => {
        navigator.clipboard?.writeText(`${window.location.origin}/${caminho}`);
      },
    },
    {
      id: "abrir",
      grupo: "ação",
      rotulo: "Abrir a proposta em outra aba",
      executar: () => window.open(`/${caminho}`, "_blank", "noopener"),
    },
    {
      id: "pdf",
      grupo: "ação",
      rotulo: "Abrir o PDF",
      executar: () => window.open(`/${caminho}/pdf`, "_blank", "noopener"),
    },
    {
      id: "lista",
      grupo: "ir para",
      rotulo: "Todas as propostas",
      executar: () => navegador.push("/admin"),
    },
  ];

  const posicao = ordem.indexOf(ativa as ChaveSecao);
  const definicao = ativa === "capa" ? null : SECOES[ativa as ChaveSecao];
  const valor = conteudo[ativa];
  const salvamento = salvamentos[ativa] ?? {};
  const Editor = definicao?.Editor;

  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[17.5rem_minmax(0,1fr)] xl:grid-cols-[17.5rem_minmax(0,1fr)_32rem] 2xl:grid-cols-[17.5rem_minmax(0,1fr)_40rem]">
      {/* trilho */}
      <aside className="border-b border-[var(--mesa-fio)] px-2 py-2 lg:sticky lg:top-[3.5rem] lg:h-[calc(100dvh-3.5rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-0 lg:py-3">
        <TrilhoDeSecoes
          ordem={ordem}
          estados={estados}
          sujas={sujas}
          ativa={ativa}
          aoEscolher={setAtiva}
          aoReordenar={reordenar}
        />
      </aside>

      {/* editor */}
      <section className="min-w-0 px-4 py-8 sm:px-8">
        <div className="mb-8">
          <Prontidao avaliacao={prontidao} aoSaltar={setAtiva} />
        </div>

        {ativa === "capa" ? (
          <>
            <CabecalhoDaSecao numero="00" titulo="Cliente e datas" />
            <div className="mt-8">
              <EditorDeCabecalho
                id={id}
                inicial={cabecalhoInicial}
                aoSalvar={() => setVersaoDaPrevia((v) => v + 1)}
                aoMudar={(suja) => marcarSuja("capa", suja)}
              />
            </div>
          </>
        ) : (
          <>
            <CabecalhoDaSecao
              numero={String(posicao + 1).padStart(2, "0")}
              titulo={definicao!.rotulo}
              resumo={definicao!.resumo}
            />

            {valor === undefined ? (
              <div className="painel-mesa mt-8 flex flex-col items-start gap-4 p-8">
                <p className="max-w-md leading-relaxed text-[var(--mesa-tinta-suave)]">
                  Esta seção não está na proposta e não aparece para o cliente, nem na
                  página nem no PDF.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConteudo((atual) => ({
                      ...atual,
                      [ativa]: definicao!.padrao(),
                    }));
                    marcarSuja(ativa, true);
                  }}
                  className="botao-mesa botao-mesa-forte"
                >
                  Adicionar seção
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8 flex flex-col gap-7">
                  {Editor && (
                    <Editor
                      valor={valor as never}
                      aoMudar={(novo: unknown) => {
                        setConteudo((atual) => ({ ...atual, [ativa]: novo }));
                        marcarSuja(ativa, true);
                        setSalvamentos((a) => ({ ...a, [ativa]: {} }));
                      }}
                    />
                  )}
                </div>

                {salvamento.erros && (
                  <ul role="alert" className="mt-6 flex flex-col gap-1">
                    {salvamento.erros.map((erro, i) => (
                      <li key={i} className="text-sm text-[var(--mesa-aviso)]">
                        {erro}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--mesa-fio)] bg-[var(--mesa-fundo)] py-4">
                  <button
                    type="button"
                    onClick={() => salvarSecao(ativa as ChaveSecao)}
                    disabled={salvamento.salvando}
                    className="botao-mesa botao-mesa-forte disabled:opacity-60"
                  >
                    {salvamento.salvando ? "Salvando..." : "Salvar seção"}
                    <span className="tecla-mesa ml-1 hidden sm:inline-flex">⌘S</span>
                  </button>

                  {sujas.has(ativa) && !salvamento.salvando && (
                    <span className="etiqueta-mesa text-[var(--mesa-acento)]">
                      alterações não salvas
                    </span>
                  )}
                  {salvamento.salvo && !sujas.has(ativa) && (
                    <span className="etiqueta-mesa text-[var(--mesa-ok)]">salvo</span>
                  )}

                  <button
                    type="button"
                    onClick={() => removerSecao(ativa as ChaveSecao)}
                    className="botao-mesa ml-auto"
                  >
                    Tirar da proposta
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* espelho */}
      <aside className="hidden xl:sticky xl:top-[3.5rem] xl:block xl:h-[calc(100dvh-3.5rem)] xl:border-l xl:border-[var(--mesa-fio)] xl:p-4">
        <PreviaAoVivo caminho={caminho} secao={ativa} versao={versaoDaPrevia} />
      </aside>

      <Comando itens={comandos} />
    </div>
  );
}

function CabecalhoDaSecao({
  numero,
  titulo,
  resumo,
}: {
  numero: string;
  titulo: string;
  resumo?: string;
}) {
  return (
    <header className="flex items-start gap-5">
      <span
        aria-hidden
        className="numeral-mesa text-[clamp(3rem,9vw,4.5rem)] text-[var(--mesa-fio-forte)]"
      >
        {numero}
      </span>
      <div className="min-w-0 pt-1">
        <h1 className="titulo-mesa text-[clamp(1.75rem,5vw,2.5rem)] text-[var(--mesa-tinta)]">
          {titulo}
        </h1>
        {resumo && (
          <p className="mt-2 text-[var(--mesa-tinta-suave)]">{resumo}</p>
        )}
      </div>
    </header>
  );
}
