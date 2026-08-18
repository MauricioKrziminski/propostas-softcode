import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sessão do painel: uma senha só, um cookie assinado.
 *
 * Por que não uma biblioteca de auth: existe UM operador, que é o dono da
 * SoftCode. Cadastro, recuperação de senha, papéis e provedores sociais seriam
 * peças para um problema que não temos. O que precisa ser sério aqui é o
 * essencial, e é o que este arquivo faz:
 *
 *   · a senha nunca é guardada em texto, só `scrypt$<sal>$<hash>`;
 *   · a comparação é em tempo constante, senão o tempo de resposta entrega
 *     quantos caracteres do começo estavam certos;
 *   · o cookie não guarda "logado: sim". Ele guarda a data de expiração e uma
 *     assinatura HMAC dela. Sem o segredo do servidor não dá para forjar, e
 *     mexer na data invalida a assinatura;
 *   · `httpOnly` mantém o cookie fora do alcance de qualquer JavaScript da
 *     página, o que tira do mapa a classe inteira de roubo de sessão por XSS.
 *
 * Trocar `SESSAO_SEGREDO` derruba todas as sessões abertas de uma vez. É o botão
 * de pânico se a senha vazar.
 */

const NOME_COOKIE = "sessao_admin";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

function segredo(): string {
  const s = process.env.SESSAO_SEGREDO;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSAO_SEGREDO ausente ou curto demais. Gere com: " +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return s;
}

function assinar(carga: string): string {
  return createHmac("sha256", segredo()).update(carga).digest("hex");
}

/** Compara sem vazar por tempo. Tamanhos diferentes já são recusa. */
function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * `scrypt:<sal>:<hash>`, no formato que `scripts/gerar-senha.mjs` grava.
 *
 * O separador é DOIS-PONTOS, e a razão é uma pegadinha que custou uma tarde: o
 * carregador de ambiente do Next expande `$alguma_coisa` como referência a
 * variável, então um hash `scrypt$sal$hash` chegava ao servidor como a palavra
 * "scrypt" e mais nada. O `node --env-file` não expande, então todo diagnóstico
 * fora do Next dizia que estava tudo certo enquanto o login recusava a senha
 * correta.
 *
 * Formato inválido agora GRITA no log do servidor. Antes devolvia só "senha
 * incorreta", que é a mensagem certa para senha errada e a pista errada para
 * ambiente quebrado.
 */
export function senhaConfere(senha: string): boolean {
  const guardado = process.env.ADMIN_SENHA_HASH;
  if (!guardado) {
    console.error("[admin] ADMIN_SENHA_HASH ausente. Rode: node scripts/gerar-senha.mjs \"sua senha\"");
    return false;
  }

  const [algoritmo, sal, hash] = guardado.split(":");
  if (algoritmo !== "scrypt" || !sal || !hash) {
    console.error(
      `[admin] ADMIN_SENHA_HASH fora do formato (recebi ${guardado.length} caracteres em ` +
        `${guardado.split(":").length} parte(s), esperava 3 separadas por ":"). ` +
        'Regere com: node scripts/gerar-senha.mjs "sua senha". ' +
        "Se o valor tem cifrão, o Next expande e come o resto da linha.",
    );
    return false;
  }

  return iguais(scryptSync(senha, sal, 64).toString("hex"), hash);
}

export async function abrirSessao(): Promise<void> {
  const expira = Date.now() + DURACAO_MS;
  const valor = `${expira}.${assinar(String(expira))}`;

  (await cookies()).set(NOME_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_MS / 1000,
  });
}

export async function fecharSessao(): Promise<void> {
  (await cookies()).delete(NOME_COOKIE);
}

export async function sessaoValida(): Promise<boolean> {
  const bruto = (await cookies()).get(NOME_COOKIE)?.value;
  if (!bruto) return false;

  const [expira, assinatura] = bruto.split(".");
  if (!expira || !assinatura) return false;
  if (!iguais(assinar(expira), assinatura)) return false;

  return Number(expira) > Date.now();
}

export const NOME_COOKIE_SESSAO = NOME_COOKIE;
