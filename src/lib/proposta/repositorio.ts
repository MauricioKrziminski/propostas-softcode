import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { bd } from "@/lib/banco/cliente";
import { propostas, type LinhaProposta } from "@/lib/banco/esquema";
import { gerarSlug, gerarToken } from "./identidade";
import {
  CHAVES_SECAO,
  conteudoSchema,
  propostaSchema,
  type ChaveSecao,
  type Conteudo,
  type Proposta,
} from "./schema";

/**
 * A porta de entrada dos dados. Substitui o antigo `seed.ts`: o JSON em
 * `src/seed/` continua existindo, mas só como SEMENTE (ver `scripts/semear.mjs`),
 * nunca mais como fonte em runtime.
 *
 * O schema Zod continua sendo a fonte da verdade do formato. O Postgres guarda
 * `jsonb`; é aqui que o formato é conferido, na leitura e na escrita.
 */

/**
 * Leitura TOLERANTE, e este é o ponto mais importante do arquivo.
 *
 * Uma proposta já enviada não pode parar de abrir porque uma seção nova mudou de
 * formato. Se a validação estourasse, o cliente receberia 500 no link que ele
 * abriu do WhatsApp, e ninguém saberia até ele avisar. Então cada seção é
 * validada SOZINHA: a que não passa é registrada no log do servidor e omitida, e
 * o resto da proposta continua de pé. Omitir seção degrada; derrubar a página
 * perde a venda.
 */
function conteudoTolerante(bruto: unknown, referencia: string): Conteudo {
  const completo = conteudoSchema.safeParse(bruto);
  if (completo.success) return completo.data;

  const cru = (bruto ?? {}) as Record<string, unknown>;
  const salvo: Record<string, unknown> = {};
  if (Array.isArray(cru.ordem)) salvo.ordem = cru.ordem;

  for (const chave of CHAVES_SECAO) {
    if (cru[chave] === undefined) continue;
    const fatia = conteudoSchema.shape[chave].safeParse(cru[chave]);
    if (fatia.success) {
      salvo[chave] = fatia.data;
    } else {
      console.error(
        `[proposta ${referencia}] seção "${chave}" fora do formato e omitida:`,
        fatia.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
  }

  const segundaTentativa = conteudoSchema.safeParse(salvo);
  if (segundaTentativa.success) return segundaTentativa.data;

  console.error(`[proposta ${referencia}] conteúdo irrecuperável, renderizando vazio`);
  return {};
}

function linhaParaProposta(linha: LinhaProposta): Proposta | null {
  const referencia = linha.caminho ?? linha.slug;
  const candidato = {
    slug: linha.slug,
    token: linha.token,
    cliente: linha.cliente,
    tituloProjeto: linha.tituloProjeto,
    status: linha.status,
    emitidaEm: linha.emitidaEm,
    validaAte: linha.validaAte,
    conteudo: conteudoTolerante(linha.conteudo, referencia),
  };

  const resultado = propostaSchema.safeParse(candidato);
  if (!resultado.success) {
    console.error(
      `[proposta ${referencia}] cabeçalho inválido:`,
      resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
    return null;
  }
  return resultado.data;
}

/**
 * Resolve pelo caminho completo `{slug}-{token}`, comparação exata contra a
 * coluna gerada. O slug sozinho não resolve nada, e token errado é indistinguível
 * de proposta inexistente: as duas situações devolvem `null` e viram o mesmo 404.
 */
export async function buscarPropostaPorCaminho(caminho: string): Promise<Proposta | null> {
  if (!caminho || caminho.length > 120) return null;

  const [linha] = await comUmaRetentativa(() =>
    bd().select().from(propostas).where(eq(propostas.caminho, caminho)).limit(1),
  );

  return linha ? linhaParaProposta(linha) : null;
}

/**
 * Uma segunda chance, só na leitura pública.
 *
 * A primeira consulta depois que o servidor sobe já falhou aqui: conexão fria
 * contra o pooler, do outro lado do país, e o erro foi transitório. No painel
 * isso seria um recarregar; na página do cliente é a proposta não abrindo no
 * link que ele acabou de receber, sem ninguém ficar sabendo. Uma repetição curta
 * cobre a falha de conexão sem mascarar erro de verdade, que falha nas duas.
 */
async function comUmaRetentativa<T>(consulta: () => Promise<T>): Promise<T> {
  try {
    return await consulta();
  } catch (erro) {
    console.error("[banco] primeira tentativa falhou, repetindo:", erro);
    await new Promise((r) => setTimeout(r, 250));
    return consulta();
  }
}

/**
 * A consulta mais barata possível, só para o banco saber que ainda existe.
 *
 * Projeto Supabase gratuito pausa depois de sete dias sem requisição. Um `select
 * 1` por dia zera esse contador. Ver `src/app/api/pulso/route.ts`.
 */
export async function pulsar(): Promise<void> {
  await bd().execute(sql`select 1`);
}

/* ─────────────────────────── o que o admin usa ─────────────────────────── */

export type ResumoProposta = {
  id: string;
  caminho: string;
  empresa: string;
  contato: string;
  tituloProjeto: string;
  status: string;
  validaAte: string;
  atualizadaEm: Date;
};

/** A lista do painel. Não traz `conteudo`: são 20KB por linha sem serventia ali. */
export async function listarPropostas(): Promise<ResumoProposta[]> {
  const linhas = await bd()
    .select({
      id: propostas.id,
      caminho: propostas.caminho,
      slug: propostas.slug,
      cliente: propostas.cliente,
      tituloProjeto: propostas.tituloProjeto,
      status: propostas.status,
      validaAte: propostas.validaAte,
      atualizadaEm: propostas.atualizadaEm,
    })
    .from(propostas)
    .orderBy(desc(propostas.atualizadaEm));

  return linhas.map((l) => ({
    id: l.id,
    caminho: l.caminho ?? l.slug,
    empresa: l.cliente?.empresa ?? "(sem empresa)",
    contato: l.cliente?.nome ?? "",
    tituloProjeto: l.tituloProjeto,
    status: l.status,
    validaAte: l.validaAte,
    atualizadaEm: l.atualizadaEm,
  }));
}

export type PropostaComId = Proposta & { id: string; caminho: string };

export async function buscarPropostaPorId(id: string): Promise<PropostaComId | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const [linha] = await bd().select().from(propostas).where(eq(propostas.id, id)).limit(1);
  if (!linha) return null;

  const proposta = linhaParaProposta(linha);
  return proposta ? { ...proposta, id: linha.id, caminho: linha.caminho ?? linha.slug } : null;
}

/**
 * Cria a proposta já com o conteúdo pronto para edição.
 *
 * O slug sai do nome da empresa e precisa ser único; em vez de perguntar ao
 * banco antes (que abre janela para colisão entre a consulta e a inserção),
 * tenta inserir e reage ao erro do índice único acrescentando um sufixo. O banco
 * é quem decide, que é o único jeito de a resposta não envelhecer.
 */
export async function criarProposta(dados: {
  empresa: string;
  contato: string;
  email?: string;
  tituloProjeto: string;
  emitidaEm: string;
  validaAte: string;
  conteudo: Conteudo;
}): Promise<string> {
  const base = gerarSlug(dados.empresa);

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const slug = tentativa === 0 ? base : `${base}-${tentativa + 1}`;
    try {
      const [linha] = await bd()
        .insert(propostas)
        .values({
          slug,
          token: gerarToken(),
          tituloProjeto: dados.tituloProjeto,
          status: "rascunho",
          cliente: {
            nome: dados.contato,
            empresa: dados.empresa,
            ...(dados.email ? { email: dados.email } : {}),
          },
          emitidaEm: dados.emitidaEm,
          validaAte: dados.validaAte,
          conteudo: dados.conteudo,
        })
        .returning({ id: propostas.id });
      return linha.id;
    } catch (erro) {
      const codigo = (erro as { code?: string }).code;
      if (codigo !== "23505") throw erro; /* 23505 = violação de índice único */
    }
  }
  throw new Error(`Não consegui um slug livre a partir de "${base}". Mude o nome da empresa.`);
}

/** Grava UMA seção. Valida a fatia e depois o conteúdo inteiro, nesta ordem. */
export async function salvarSecao(
  id: string,
  chave: ChaveSecao,
  valor: unknown,
): Promise<{ ok: true } | { ok: false; erros: string[] }> {
  const fatia = conteudoSchema.shape[chave].safeParse(valor);
  if (!fatia.success) {
    return {
      ok: false,
      erros: fatia.error.issues.map((i) => `${i.path.join(".") || chave}: ${i.message}`),
    };
  }

  const [linha] = await bd()
    .select({ conteudo: propostas.conteudo })
    .from(propostas)
    .where(eq(propostas.id, id))
    .limit(1);
  if (!linha) return { ok: false, erros: ["Proposta não encontrada"] };

  const novo = { ...linha.conteudo, [chave]: fatia.data };
  if (fatia.data === undefined) delete (novo as Record<string, unknown>)[chave];

  const inteiro = conteudoSchema.safeParse(novo);
  if (!inteiro.success) {
    return {
      ok: false,
      erros: inteiro.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  await bd()
    .update(propostas)
    .set({ conteudo: inteiro.data, atualizadaEm: new Date() })
    .where(eq(propostas.id, id));
  return { ok: true };
}

/**
 * Grava a ordem em que o cliente lê as seções.
 *
 * A ordem sempre existiu no schema (`conteudo.ordem`) e a página sempre
 * respeitou; o que faltava era como mexer nela sem editar JSON. Guarda só as
 * chaves conhecidas, e sem repetir: ordem inválida faria a página pular ou
 * duplicar seção.
 */
export async function salvarOrdem(
  id: string,
  ordem: ChaveSecao[],
): Promise<{ ok: true } | { ok: false; erros: string[] }> {
  const limpa = [...new Set(ordem)].filter((c) => CHAVES_SECAO.includes(c));
  if (limpa.length !== CHAVES_SECAO.length) {
    return { ok: false, erros: ["A ordem precisa conter todas as seções, sem repetir"] };
  }

  const [linha] = await bd()
    .select({ conteudo: propostas.conteudo })
    .from(propostas)
    .where(eq(propostas.id, id))
    .limit(1);
  if (!linha) return { ok: false, erros: ["Proposta não encontrada"] };

  const inteiro = conteudoSchema.safeParse({ ...linha.conteudo, ordem: limpa });
  if (!inteiro.success) {
    return {
      ok: false,
      erros: inteiro.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  await bd()
    .update(propostas)
    .set({ conteudo: inteiro.data, atualizadaEm: new Date() })
    .where(eq(propostas.id, id));
  return { ok: true };
}

export async function salvarCabecalho(
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
): Promise<{ ok: true } | { ok: false; erros: string[] }> {
  const parcial = propostaSchema.safeParse({
    slug: "validacao-de-cabecalho",
    token: "0000000000",
    cliente: {
      nome: dados.contato,
      empresa: dados.empresa,
      ...(dados.email ? { email: dados.email } : {}),
      ...(dados.logoUrl ? { logoUrl: dados.logoUrl } : {}),
    },
    tituloProjeto: dados.tituloProjeto,
    status: dados.status,
    emitidaEm: dados.emitidaEm,
    validaAte: dados.validaAte,
    conteudo: {},
  });
  if (!parcial.success) {
    return {
      ok: false,
      erros: parcial.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  await bd()
    .update(propostas)
    .set({
      cliente: parcial.data.cliente,
      tituloProjeto: parcial.data.tituloProjeto,
      status: parcial.data.status,
      emitidaEm: parcial.data.emitidaEm,
      validaAte: parcial.data.validaAte,
      atualizadaEm: new Date(),
    })
    .where(eq(propostas.id, id));
  return { ok: true };
}

export async function alterarStatus(id: string, status: string): Promise<void> {
  await bd()
    .update(propostas)
    .set({ status, atualizadaEm: new Date() })
    .where(eq(propostas.id, id));
}

/**
 * Duplicar existe porque proposta nova quase sempre nasce de uma antiga. A cópia
 * ganha TOKEN NOVO: reaproveitar o token faria duas propostas responderem pelo
 * mesmo endereço, e a antiga já está no WhatsApp de alguém.
 */
export async function duplicarProposta(id: string): Promise<string | null> {
  const original = await buscarPropostaPorId(id);
  if (!original) return null;

  return criarProposta({
    empresa: original.cliente.empresa,
    contato: original.cliente.nome,
    email: original.cliente.email,
    tituloProjeto: original.tituloProjeto,
    emitidaEm: new Date().toISOString().slice(0, 10),
    validaAte: original.validaAte,
    conteudo: original.conteudo,
  });
}

export async function excluirProposta(id: string): Promise<void> {
  await bd().delete(propostas).where(eq(propostas.id, id));
}
