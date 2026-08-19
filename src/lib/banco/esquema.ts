import { sql } from "drizzle-orm";
import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Conteudo, Proposta } from "@/lib/proposta/schema";

/**
 * A tabela `propostas`, uma linha por proposta.
 *
 * O formato é o mesmo que o JSON do seed já tinha, de propósito: `cliente` e
 * `conteudo` entram como `jsonb` porque quem garante o formato deles é o Zod em
 * `schema.ts`, não o Postgres. Espalhar as dez seções em colunas seria trocar
 * uma fonte da verdade por duas.
 *
 * `caminho` é coluna GERADA (`slug || '-' || token`), com índice único.
 * Sem ela, resolver a URL exigiria quebrar `{slug}-{token}` no último hífen, e o
 * alfabeto do token admite hífen: `barba-log-7fk-2m9x4q` teria duas leituras
 * possíveis. Comparação exata contra uma coluna indexada não tem essa dúvida, e
 * ainda é o índice que impede duas propostas com a mesma URL.
 */
export const propostas = pgTable(
  "propostas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    token: text("token").notNull(),
    caminho: text("caminho").generatedAlwaysAs(sql`slug || '-' || token`),

    tituloProjeto: text("titulo_projeto").notNull(),
    status: text("status").notNull().default("rascunho"),
    cliente: jsonb("cliente").$type<Proposta["cliente"]>().notNull(),

    emitidaEm: date("emitida_em").notNull(),
    validaAte: date("valida_ate").notNull(),
    conteudo: jsonb("conteudo").$type<Conteudo>().notNull(),

    criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadaEm: timestamp("atualizada_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("propostas_slug_unico").on(t.slug),
    uniqueIndex("propostas_caminho_unico").on(t.caminho),
  ],
);

export type LinhaProposta = typeof propostas.$inferSelect;
export type NovaLinhaProposta = typeof propostas.$inferInsert;

/**
 * `proposta_eventos`, uma linha por ação do cliente na proposta dele.
 *
 * Ela existe por dois motivos que são o mesmo motivo: o Gabriel recebe um e-mail
 * a cada ação, e e-mail repetido em cada F5 seria ruído até virar filtro. Então
 * quem decide se o e-mail sai é o BANCO, não a aplicação: a inserção é
 * `on conflict do nothing` contra o índice único, e o e-mail só vai embora se
 * uma linha realmente nasceu. Uma verificação, não duas.
 *
 * `chave` é o que define o intervalo de repetição, e cada tipo escolhe a sua:
 *   · abrir e baixar PDF usam a DATA (`2026-08-19`), então repetem no dia
 *     seguinte, mas não a cada rolagem de tela;
 *   · o aceite usa um valor único por clique, porque aceite nunca pode ser
 *     engolido por deduplicação. Perder um "abriu" é irrelevante, perder um
 *     "fechou negócio" é perder a venda.
 *
 * `ip` e `userAgent` só são preenchidos no aceite, e não por completismo: a
 * seção de aceite promete ao cliente, em texto, que "registramos data, hora,
 * endereço IP e navegador". Esta tabela é o que torna aquela frase verdadeira.
 */
export const propostaEventos = pgTable(
  "proposta_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propostaId: uuid("proposta_id")
      .notNull()
      .references(() => propostas.id, { onDelete: "cascade" }),

    tipo: text("tipo").notNull(),
    chave: text("chave").notNull(),
    detalhe: jsonb("detalhe").$type<Record<string, unknown>>(),

    ip: text("ip"),
    userAgent: text("user_agent"),

    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("proposta_eventos_unico").on(t.propostaId, t.tipo, t.chave),
    index("proposta_eventos_por_proposta").on(t.propostaId, t.criadoEm),
  ],
);

export type LinhaEvento = typeof propostaEventos.$inferSelect;
