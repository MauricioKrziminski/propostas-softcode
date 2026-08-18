"use client";

import { useState, useTransition } from "react";

import { salvarCabecalhoDaProposta } from "@/app/admin/acoes";
import { BotaoExcluir } from "./BotaoExcluir";
import { CampoData, CampoSelecao, CampoTexto } from "./campos";
import { STATUS_PROPOSTA } from "@/lib/proposta/schema";

/**
 * Cliente, título, datas e status: a capa da proposta.
 *
 * Slug e token NÃO aparecem aqui, e é de propósito: os dois formam o endereço
 * que já foi para o WhatsApp do cliente, e trocar qualquer um dos dois quebra o
 * link que ele tem. Precisando de endereço novo, o caminho é duplicar.
 */
export type DadosDoCabecalho = {
  empresa: string;
  contato: string;
  email: string;
  logoUrl: string;
  tituloProjeto: string;
  status: string;
  emitidaEm: string;
  validaAte: string;
};

export function EditorDeCabecalho({
  id,
  inicial,
  aoSalvar,
  aoMudar,
}: {
  id: string;
  inicial: DadosDoCabecalho;
  aoSalvar?: () => void;
  aoMudar?: (suja: boolean) => void;
}) {
  const [dados, setDados] = useState(inicial);
  const [estado, setEstado] = useState<{ salvo?: boolean; erros?: string[] }>({});
  const [salvando, iniciarTransicao] = useTransition();

  const trocar = (campo: keyof DadosDoCabecalho) => (v: string) => {
    setDados((atual) => ({ ...atual, [campo]: v }));
    setEstado({});
    aoMudar?.(true);
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <CampoTexto rotulo="Empresa" valor={dados.empresa} aoMudar={trocar("empresa")} />
        <CampoTexto
          rotulo="Pessoa de contato"
          valor={dados.contato}
          aoMudar={trocar("contato")}
        />
        <CampoTexto rotulo="E-mail" valor={dados.email} aoMudar={trocar("email")} />
        <CampoTexto
          rotulo="Logo do cliente (URL)"
          dica="Aparece no topo da proposta. Vazio esconde o espaço, não deixa buraco."
          valor={dados.logoUrl}
          aoMudar={trocar("logoUrl")}
        />
        <CampoTexto
          rotulo="Título do projeto"
          valor={dados.tituloProjeto}
          aoMudar={trocar("tituloProjeto")}
        />
        <CampoSelecao
          rotulo="Status"
          dica="Rascunho abre só para você e não gera PDF. Enviada é o que o cliente consegue abrir."
          valor={dados.status}
          opcoes={STATUS_PROPOSTA}
          aoMudar={trocar("status")}
        />
        <CampoData
          rotulo="Emitida em"
          valor={dados.emitidaEm}
          aoMudar={trocar("emitidaEm")}
        />
        <CampoData
          rotulo="Válida até"
          dica="Depois desta data a proposta abre no estado expirada, com convite para conversar."
          valor={dados.validaAte}
          aoMudar={trocar("validaAte")}
        />
      </div>

      {estado.erros && (
        <ul role="alert" className="flex flex-col gap-1">
          {estado.erros.map((erro, i) => (
            <li key={i} className="text-sm text-[var(--mesa-aviso)]">
              {erro}
            </li>
          ))}
        </ul>
      )}

      {/* Excluir mora no fim da capa, longe dos campos que se mexe todo dia, e
          com o aviso do que a exclusão leva junto. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[var(--mesa-fio)] p-4">
        <p className="max-w-md text-sm leading-relaxed text-[var(--mesa-tinta-apagada)]">
          Excluir apaga a proposta do banco e derruba o link que o cliente tem.
          Não há desfazer.
        </p>
        <BotaoExcluir id={id} empresa={dados.empresa} />
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-[var(--mesa-fio)] bg-[var(--mesa-fundo)] py-4">
        <button
          type="button"
          disabled={salvando}
          onClick={() =>
            iniciarTransicao(async () => {
              const resposta = await salvarCabecalhoDaProposta(id, {
                empresa: dados.empresa,
                contato: dados.contato,
                email: dados.email || undefined,
                logoUrl: dados.logoUrl || undefined,
                tituloProjeto: dados.tituloProjeto,
                status: dados.status,
                emitidaEm: dados.emitidaEm,
                validaAte: dados.validaAte,
              });
              if (resposta.erros) {
                setEstado({ erros: resposta.erros });
                return;
              }
              setEstado({ salvo: true });
              aoMudar?.(false);
              aoSalvar?.();
            })
          }
          className="botao-mesa botao-mesa-forte disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar capa"}
        </button>
        {estado.salvo && (
          <span className="etiqueta-mesa text-[var(--mesa-ok)]">salvo</span>
        )}
      </div>
    </div>
  );
}
