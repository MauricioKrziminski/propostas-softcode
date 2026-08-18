import type { Config } from "drizzle-kit";

/**
 * Config do drizzle-kit, usada para GERAR o SQL a partir de
 * `src/lib/banco/esquema.ts`:
 *
 *   npx drizzle-kit generate
 *
 * A aplicação do SQL no Supabase é feita à parte, e de propósito: `push` compara
 * e altera o banco direto, sem deixar registro do que mudou. Num banco que
 * guarda proposta já enviada para cliente, o arquivo de migração revisado antes
 * de rodar vale mais que a conveniência.
 */
export default {
  schema: "./src/lib/banco/esquema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
} satisfies Config;
