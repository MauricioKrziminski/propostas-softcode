/**
 * Gera o valor de `ADMIN_SENHA_HASH` para o `.env.local`.
 *
 *   node scripts/gerar-senha.mjs "a senha que voce quiser"
 *
 * A senha em texto puro não é guardada em lugar nenhum: o que vai para o
 * ambiente é `scrypt$<sal>$<hash>`. Quem conseguir ler o arquivo de ambiente não
 * consegue entrar no painel com o que encontrou ali.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const senha = process.argv[2];
if (!senha || senha.length < 8) {
  console.error('Uso: node scripts/gerar-senha.mjs "sua senha" (mínimo 8 caracteres)');
  process.exit(1);
}

const sal = randomBytes(16).toString("hex");
const linha = `ADMIN_SENHA_HASH=scrypt$${sal}$${scryptSync(senha, sal, 64).toString("hex")}`;

/**
 * Por padrão o script GRAVA direto no `.env.local`, em vez de imprimir o hash na
 * tela. Hash colado à mão passa pelo terminal, pelo histórico do shell e às
 * vezes por uma conversa; gravando direto, ele nasce e morre dentro do arquivo
 * que já está no .gitignore. Use `--mostrar` se precisar do valor para colar em
 * outro lugar, como as variáveis de ambiente da Vercel.
 */
if (process.argv.includes("--mostrar")) {
  console.log(`\n${linha}\n`);
  process.exit(0);
}

const arquivo = ".env.local";
const atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
const novo = /^ADMIN_SENHA_HASH=.*$/m.test(atual)
  ? atual.replace(/^ADMIN_SENHA_HASH=.*$/m, linha)
  : `${atual}${atual.endsWith("\n") || atual === "" ? "" : "\n"}${linha}\n`;

writeFileSync(arquivo, novo, "utf8");
console.log(`\n✓ ADMIN_SENHA_HASH gravado em ${arquivo}. A senha em si não fica em lugar nenhum.\n`);
