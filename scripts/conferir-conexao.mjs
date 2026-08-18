/**
 * Confere o `.env.local` sem nunca imprimir segredo.
 *
 *   npm run conferir
 *
 * Existe porque a string de conexão do Postgres carrega a senha do banco dentro
 * dela, e conferir "se está certa" olhando o valor significaria expor a senha no
 * terminal, no histórico do shell ou numa conversa. Aqui só aparecem usuário,
 * host, porta e banco; a senha vira o comprimento dela e mais nada.
 */
import postgres from "postgres";

const problemas = [];
const avisos = [];

function ler(nome) {
  const v = process.env[nome];
  if (!v) problemas.push(`${nome} está vazia no .env.local`);
  return v ?? "";
}

const url = ler("DATABASE_URL");
const hash = ler("ADMIN_SENHA_HASH");
const segredo = ler("SESSAO_SEGREDO");

console.log("\n▸ .env.local");

if (url) {
  try {
    const u = new URL(url);
    const porta = u.port || "(padrão)";
    console.log(`  usuário  ${u.username}`);
    console.log(`  host     ${u.hostname}`);
    console.log(`  porta    ${porta}`);
    console.log(`  banco    ${u.pathname.replace("/", "")}`);
    console.log(`  senha    ${u.password ? `${u.password.length} caracteres` : "AUSENTE"}`);

    if (!u.password) problemas.push("a senha não foi substituída na URL (o [YOUR-PASSWORD] continua lá?)");
    if (u.password.includes("[") || u.password.includes("]"))
      problemas.push("a senha ainda está entre colchetes: tire os colchetes junto com o texto");
    if (!u.protocol.startsWith("postgres"))
      problemas.push(`protocolo ${u.protocol} não é postgresql://`);
    if (u.hostname.endsWith(".supabase.co"))
      problemas.push(
        "esse host é a conexão DIRETA (db.<ref>.supabase.co). Use o Transaction pooler, host terminado em .pooler.supabase.com",
      );
    if (u.port === "5432" && u.hostname.includes("pooler"))
      avisos.push("porta 5432 no pooler é o modo SESSÃO. O modo transação, que é o que serverless pede, é a 6543");
    if (/[@:/?#]/.test(decodeURIComponent(u.password || "")) && u.password === decodeURIComponent(u.password || ""))
      avisos.push("a senha parece ter caractere especial sem codificar, o que costuma quebrar a URL");
  } catch {
    problemas.push("DATABASE_URL não é uma URL válida (sobrou aspas ou espaço?)");
  }
}

if (hash && hash.split(":").length !== 3)
  problemas.push('ADMIN_SENHA_HASH fora do formato: rode node scripts/gerar-senha.mjs "sua senha"');
if (segredo && segredo.length < 32) problemas.push("SESSAO_SEGREDO curto demais");

/**
 * O teste que faltava: ler o ambiente COMO O SERVIDOR LÊ.
 *
 * O `node --env-file` entrega o valor cru; o carregador do Next passa por
 * expansão de variáveis e transforma `$algo` no valor de `algo`, quase sempre
 * vazio. Foi assim que um hash de senha perfeitamente válido virou a palavra
 * "scrypt" dentro do servidor, com o login recusando a senha certa enquanto todo
 * diagnóstico de fora dizia que estava tudo em ordem. Comparar os dois
 * carregadores é o que transforma esse defeito mudo em uma linha de erro.
 */
/* O pacote é CommonJS: no import ESM ele chega dentro de `default`. */
const { loadEnvConfig } = (await import("@next/env")).default;
const cru = { DATABASE_URL: url, ADMIN_SENHA_HASH: hash, SESSAO_SEGREDO: segredo };
loadEnvConfig(process.cwd(), true, { info: () => {}, error: () => {} });

for (const [nome, valorCru] of Object.entries(cru)) {
  const comoNext = process.env[nome] ?? "";
  if (valorCru && comoNext !== valorCru) {
    problemas.push(
      `${nome} chega diferente no Next (${comoNext.length} caracteres contra ${valorCru.length}). ` +
        "Quase sempre é cifrão no valor, que o Next expande como variável. " +
        "Escape com \\$ ou troque por um valor sem cifrão.",
    );
  }
}

console.log(`  senha do painel  ${hash ? "configurada" : "AUSENTE"}`);
console.log(`  segredo de sessão ${segredo ? `${segredo.length} caracteres` : "AUSENTE"}`);

if (problemas.length === 0 && url) {
  console.log("\n▸ conexão");
  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
  try {
    const [linha] = await sql`select current_database() as banco, now() as agora`;
    console.log(`  ok    conectou em ${linha.banco}`);
    const [{ contagem }] = await sql`select count(*)::int as contagem from propostas`;
    console.log(`  ok    tabela propostas responde (${contagem} linha(s))`);
  } catch (erro) {
    problemas.push(`não consegui conectar: ${erro.message}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

for (const aviso of avisos) console.log(`\n  atenção: ${aviso}`);
if (problemas.length > 0) {
  console.log("\n✗ falta ajustar:");
  for (const p of problemas) console.log(`  · ${p}`);
  console.log("");
  process.exit(1);
}
console.log("\n✓ tudo certo, dá para semear o banco\n");
