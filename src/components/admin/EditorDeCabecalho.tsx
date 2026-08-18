"use client";

import { useState, useTransition } from "react";

import { salvarCabecalhoDaProposta } from "@/app/admin/acoes";
import { CampoData, CampoSelecao, CampoTexto } from "./campos";
import { STATUS_PROPOSTA } from "@/lib/proposta/schema";

/**
 * Cliente, título, datas e status.
 *
 * Slug e token NÃO são editáveis: os dois formam o endereço que já foi enviado
 * para o cliente, e trocar qualquer um dos dois quebra o link que está no
 * WhatsApp dele. Precisando de endereço novo, o caminho é duplicar.
 */
export function EditorDeCabecalho({
  id,
  inicial,
}: {
  id: string;
  inicial: {
    empresa: string;
    contato: string;
    email: string;
    logoUrl: string;
    tituloProjeto: string;
    status: string;
    emitidaEm: string;
    validaAte: string;
  };
}) {
  const [dados, setDados] = useState(inicial);
  const [estado, setEstado] = useState<{ salvo?: boolean; erros?: string[] }>({});
  const [salvando, iniciarTransicao] = useTransition();

  const trocar = (campo: keyof typeof dados) => (v: string) => {
    setDados((atual) => ({ ...atual, [campo]: v }));
    setEstado({});
  };

  return (
    <section className="rounded-xl border border-linha bg-fundo p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold text-navy">Cliente e datas</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <CampoTexto rotulo="Empresa" valor={dados.empresa} aoMudar={trocar("empresa")} />
        <CampoTexto
          rotulo="Pessoa de contato"
          valor={dados.contato}
          aoMudar={trocar("contato")}
        />
        <CampoTexto rotulo="E-mail" valor={dados.email} aoMudar={trocar("email")} />
        <CampoTexto
          rotulo="Logo do cliente (URL)"
          dica="Aparece no topo da proposta. Deixe vazio se não houver."
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
          dica="Rascunho não gera PDF. Marque como enviada quando mandar o link."
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
        <ul role="alert" className="mt-4 flex flex-col gap-1">
          {estado.erros.map((erro, i) => (
            <li key={i} className="text-sm text-acento">
              {erro}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center gap-3">
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
              setEstado(resposta.erros ? { erros: resposta.erros } : { salvo: true });
            })
          }
          className="min-h-11 rounded-lg bg-acento px-5 text-sm font-medium text-osso disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {estado.salvo && <span className="text-sm text-neblina">Salvo</span>}
      </div>
    </section>
  );
}
