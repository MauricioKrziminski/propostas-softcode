import "server-only";

import { redirect } from "next/navigation";

import { sessaoValida } from "./sessao";

/**
 * A autorização de verdade do painel, e o único lugar que decide isso.
 *
 * O `proxy.ts` também olha o cookie, mas só para redirecionar cedo: ele roda
 * antes da renderização, não enxerga o resultado da verificação de assinatura de
 * forma barata, e a própria doc do Next avisa para não usá-lo como camada de
 * autorização. Server Action, além disso, é um endpoint HTTP: quem souber o id
 * dela pode chamá-la direto, sem nunca passar por rota alguma.
 *
 * Por isso a regra é literal: TODA página do admin e TODA action chamam
 * `exigirAdmin()` na primeira linha.
 */
export async function exigirAdmin(): Promise<void> {
  if (!(await sessaoValida())) redirect("/painel");
}

/** Para Server Actions: falha explícita em vez de redirecionar. */
export async function exigirAdminOuErro(): Promise<void> {
  if (!(await sessaoValida())) throw new Error("Sessão expirada. Entre de novo.");
}

/**
 * Limite de tentativas de senha.
 *
 * Vive em memória: numa instância serverless isso significa que o contador zera
 * quando a instância recicla, e cada instância tem o seu. Não é rate limit de
 * verdade, e não pretende ser. O que ele resolve é o caso real aqui, alguém
 * batendo senha em sequência na mesma conexão, sem trazer Redis para um painel
 * de um usuário só.
 */
const TETO = 5;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, { contador: number; desde: number }>();

export function podeTentar(origem: string): boolean {
  const agora = Date.now();
  const atual = tentativas.get(origem);
  if (!atual || agora - atual.desde > JANELA_MS) return true;
  return atual.contador < TETO;
}

export function registrarFalha(origem: string): void {
  const agora = Date.now();
  const atual = tentativas.get(origem);
  if (!atual || agora - atual.desde > JANELA_MS) {
    tentativas.set(origem, { contador: 1, desde: agora });
    return;
  }
  atual.contador += 1;
}

export function limparTentativas(origem: string): void {
  tentativas.delete(origem);
}
