import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as esquema from "./esquema";

/**
 * A conexão com o Postgres do Supabase.
 *
 * `import "server-only"` no topo não é decoração: é o que faz o build FALHAR se
 * algum componente de cliente importar este módulo por engano. A string de
 * conexão carrega a senha do banco, e um import errado a mandaria para o bundle
 * do navegador sem nenhum aviso.
 *
 * A conexão é PREGUIÇOSA, e isso não é detalhe de estilo: o `next build` avalia
 * o módulo de cada rota para coletar configuração, então conectar no topo do
 * arquivo quebrava o build inteiro em qualquer máquina sem `DATABASE_URL`
 * (CI, clone novo, deploy antes de configurar). Conectar na primeira consulta
 * mantém build e runtime independentes.
 *
 * Três detalhes que o pooler de transação do Supabase (porta 6543) exige:
 *   · `prepare: false`, porque o modo transação não mantém prepared statements
 *     entre requisições e o postgres.js quebraria na segunda chamada;
 *   · poucas conexões por instância, já que cada função serverless abre a sua;
 *   · reaproveitar a conexão entre recargas do dev server, senão o HMR abre uma
 *     conexão nova a cada salvamento até o pooler recusar.
 */

type Conexao = ReturnType<typeof drizzle<typeof esquema>>;

const global_ = globalThis as unknown as {
  __bdPropostas?: Conexao;
  __sqlPropostas?: ReturnType<typeof postgres>;
};

export function bd(): Conexao {
  if (global_.__bdPropostas) return global_.__bdPropostas;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Copie .env.example para .env.local e preencha " +
        "com a URL do pooler de transação do Supabase (porta 6543).",
    );
  }

  const sql = global_.__sqlPropostas ?? postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
  const conexao = drizzle(sql, { schema: esquema });

  global_.__sqlPropostas = sql;
  global_.__bdPropostas = conexao;
  return conexao;
}
