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

const senha = process.argv[2];
if (!senha || senha.length < 8) {
  console.error('Uso: node scripts/gerar-senha.mjs "sua senha" (mínimo 8 caracteres)');
  process.exit(1);
}

const sal = randomBytes(16).toString("hex");
const hash = scryptSync(senha, sal, 64).toString("hex");

console.log(`\nADMIN_SENHA_HASH=scrypt$${sal}$${hash}\n`);
console.log("Cole a linha acima no .env.local. A senha em si não fica gravada.\n");
