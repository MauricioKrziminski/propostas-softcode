"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { exigirAdminOuErro, limparTentativas, podeTentar, registrarFalha } from "@/lib/admin/guarda";
import { abrirSessao, fecharSessao, senhaConfere } from "@/lib/admin/sessao";
import {
  alterarStatus,
  criarProposta,
  duplicarProposta,
  excluirProposta,
  salvarCabecalho,
  salvarOrdem,
  salvarSecao,
} from "@/lib/proposta/repositorio";
import { modeloDeConteudo } from "@/lib/proposta/modelo";
import { STATUS_PROPOSTA, type ChaveSecao } from "@/lib/proposta/schema";

/**
 * As Server Actions do painel.
 *
 * Toda action que mexe em dado começa com `exigirAdminOuErro()`, sem exceção.
 * Server Action é um endpoint HTTP de verdade: quem descobrir o id dela pode
 * chamá-la direto, sem passar por página nenhuma e sem o proxy ver. Confiar na
 * rota que renderizou o botão seria confiar no cliente.
 */

export type EstadoFormulario = { erro?: string; erros?: string[]; ok?: boolean };

async function origem(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/* ─────────────────────────── sessão ─────────────────────────── */

export async function entrar(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const quem = await origem();
  if (!podeTentar(quem)) {
    return { erro: "Tentativas demais. Espere 15 minutos." };
  }

  const senha = String(dados.get("senha") ?? "");

  /* Atraso fixo em toda tentativa, certa ou errada. Sem ele, a diferença de
     tempo entre "senha errada" e "senha certa" vira um sinal para quem estiver
     testando em série. */
  await new Promise((r) => setTimeout(r, 400));

  if (!senha || !senhaConfere(senha)) {
    registrarFalha(quem);
    return { erro: "Senha incorreta." };
  }

  limparTentativas(quem);
  await abrirSessao();
  redirect("/admin");
}

export async function sair(): Promise<void> {
  await fecharSessao();
  redirect("/admin/entrar");
}

/* ─────────────────────────── propostas ─────────────────────────── */

export async function novaProposta(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  await exigirAdminOuErro();

  const empresa = String(dados.get("empresa") ?? "").trim();
  const contato = String(dados.get("contato") ?? "").trim();
  const email = String(dados.get("email") ?? "").trim();
  const tituloProjeto = String(dados.get("tituloProjeto") ?? "").trim();
  const validaAte = String(dados.get("validaAte") ?? "").trim();

  if (!empresa || !contato || !tituloProjeto || !validaAte) {
    return { erro: "Empresa, contato, título do projeto e validade são obrigatórios." };
  }

  const hoje = new Date().toISOString().slice(0, 10);
  if (validaAte < hoje) return { erro: "A validade não pode ser anterior a hoje." };

  let id: string;
  try {
    id = await criarProposta({
      empresa,
      contato,
      email: email || undefined,
      tituloProjeto,
      emitidaEm: hoje,
      validaAte,
      conteudo: modeloDeConteudo({ empresa, tituloProjeto }),
    });
  } catch (erro) {
    return { erro: erro instanceof Error ? erro.message : "Não consegui criar a proposta." };
  }

  revalidatePath("/admin");
  redirect(`/admin/${id}`);
}

export async function duplicar(dados: FormData): Promise<void> {
  await exigirAdminOuErro();
  const novo = await duplicarProposta(String(dados.get("id")));
  revalidatePath("/admin");
  if (novo) redirect(`/admin/${novo}`);
}

export async function mudarStatus(dados: FormData): Promise<void> {
  await exigirAdminOuErro();
  const status = String(dados.get("status"));
  if (!(STATUS_PROPOSTA as readonly string[]).includes(status)) return;

  await alterarStatus(String(dados.get("id")), status);
  revalidatePath("/admin");
}

/**
 * Troca de status em um clique, chamada pela trilha.
 *
 * Existe separada de `mudarStatus` (que recebe FormData e serve aos botões de
 * arquivar) porque aqui quem chama é um componente de cliente com o id em mãos,
 * e um `<form>` escondido só para isso seria cerimônia sem ganho.
 */
export async function definirStatus(id: string, status: string): Promise<EstadoFormulario> {
  await exigirAdminOuErro();

  if (!(STATUS_PROPOSTA as readonly string[]).includes(status)) {
    return { erro: "Status desconhecido." };
  }

  await alterarStatus(id, status);
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  return { ok: true };
}

export async function excluir(dados: FormData): Promise<void> {
  await exigirAdminOuErro();
  await excluirProposta(String(dados.get("id")));
  revalidatePath("/admin");
  redirect("/admin");
}

/* ─────────────────────────── edição ─────────────────────────── */

export async function salvarSecaoDaProposta(
  id: string,
  chave: ChaveSecao,
  valor: unknown,
): Promise<EstadoFormulario> {
  await exigirAdminOuErro();

  const resultado = await salvarSecao(id, chave, valor);
  if (!resultado.ok) return { erros: resultado.erros };

  revalidatePath(`/admin/${id}`);
  return { ok: true };
}

export async function salvarOrdemDasSecoes(
  id: string,
  ordem: ChaveSecao[],
): Promise<EstadoFormulario> {
  await exigirAdminOuErro();

  const resultado = await salvarOrdem(id, ordem);
  if (!resultado.ok) return { erros: resultado.erros };

  revalidatePath(`/admin/${id}`);
  return { ok: true };
}

export async function salvarCabecalhoDaProposta(
  id: string,
  dados: {
    empresa: string;
    contato: string;
    email?: string;
    logoUrl?: string;
    tituloProjeto: string;
    status: string;
    emitidaEm: string;
    validaAte: string;
  },
): Promise<EstadoFormulario> {
  await exigirAdminOuErro();

  const resultado = await salvarCabecalho(id, dados);
  if (!resultado.ok) return { erros: resultado.erros };

  revalidatePath(`/admin/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}
