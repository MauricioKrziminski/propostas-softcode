/**
 * Semeia o banco com as propostas que existem em `src/seed/`.
 *
 *   npm run semear
 *
 * O JSON do seed deixou de ser lido em runtime quando o Postgres entrou. Ele
 * continua no repositório por um motivo só: é a proposta real da Barba Log, e
 * ela precisa existir no banco novo sem ser redigitada.
 *
 * É idempotente pelo slug: rodar duas vezes atualiza a linha em vez de duplicar,
 * então dá para usar também para devolver uma proposta ao estado original depois
 * de brincar com ela no admin.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL não configurada.\n" +
      "Copie .env.example para .env.local e preencha com a URL do pooler de\n" +
      "transação do Supabase (Connect > Transaction pooler, porta 6543).",
  );
  process.exit(1);
}

const ARQUIVOS = ["barba-log.json", "corretor-bastos.json", "scai-do-sul.json"];
const sql = postgres(url, { prepare: false, max: 1 });

let inseridas = 0;
for (const arquivo of ARQUIVOS) {
  const bruto = await readFile(path.join("src", "seed", arquivo), "utf8");
  const p = JSON.parse(bruto);

  await sql`
    insert into propostas
      (slug, token, titulo_projeto, status, cliente, emitida_em, valida_ate, conteudo)
    values (
      ${p.slug}, ${p.token}, ${p.tituloProjeto}, ${p.status ?? "rascunho"},
      ${sql.json(p.cliente)}, ${p.emitidaEm}, ${p.validaAte}, ${sql.json(p.conteudo)}
    )
    on conflict (slug) do update set
      token = excluded.token,
      titulo_projeto = excluded.titulo_projeto,
      status = excluded.status,
      cliente = excluded.cliente,
      emitida_em = excluded.emitida_em,
      valida_ate = excluded.valida_ate,
      conteudo = excluded.conteudo,
      atualizada_em = now()
  `;
  inseridas++;
  console.log(`  ok    ${p.slug}-${p.token}`);
}

await sql.end();
console.log(`\n✓ ${inseridas} proposta(s) no banco\n`);
