import { sql } from "drizzle-orm";
import { date, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
