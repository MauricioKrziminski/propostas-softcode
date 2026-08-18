/**
 * Validação do painel, de ponta a ponta.
 *
 *   npm run valida:admin        (com o dev server no ar)
 *
 * Percorre o caminho real: entrar, criar proposta, conferir que o alicerce veio
 * preenchido, marcar como enviada, abrir o link público e gerar o PDF. No fim,
 * apaga a proposta de teste.
 *
 * A sessão é ASSINADA aqui com o `SESSAO_SEGREDO`, em vez de digitar a senha:
 * a senha do painel é do operador e não precisa (nem deve) estar num script. O
 * cookie é montado exatamente como `src/lib/admin/sessao.ts` monta, então o que
 * está sendo testado continua sendo o caminho de verdade.
 */
import { createHmac } from "node:crypto";
import { chromium, devices, request } from "@playwright/test";
import postgres from "postgres";

const BASE = process.argv[2] ?? "http://localhost:3000";
const iPhone = devices["iPhone 14"];
let falhas = 0;

function checar(condicao, textoOk, textoFalha = textoOk, extra = "") {
  if (condicao) {
    console.log(`  ok    ${textoOk}`);
  } else {
    falhas++;
    console.log(`  FALHA ${textoFalha}${extra ? `\n        ${extra}` : ""}`);
  }
}

const segredo = process.env.SESSAO_SEGREDO;
if (!segredo) {
  console.error("SESSAO_SEGREDO ausente. Rode com: npm run valida:admin");
  process.exit(1);
}

const expira = String(Date.now() + 60 * 60 * 1000);
const cookieSessao = {
  name: "sessao_admin",
  value: `${expira}.${createHmac("sha256", segredo).update(expira).digest("hex")}`,
  domain: "localhost",
  path: "/",
  httpOnly: true,
  sameSite: "Lax",
};

const EMPRESA = "Cliente de Teste E2E";
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ ...iPhone });
await ctx.addCookies([cookieSessao]);
const pg = await ctx.newPage();
const erros = [];
pg.on("pageerror", (e) => erros.push(String(e)));

/* ───────────── 1. lista ───────────── */
console.log(`\n▸ painel em 390px: ${BASE}/admin`);
await pg.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
checar(
  pg.url().endsWith("/admin"),
  "sessão assinada entra no painel",
  `caiu em ${pg.url()}: o cookie assinado deveria ser aceito`,
);
checar(
  (await pg.content()).includes("Barba Log"),
  "a proposta semeada aparece na lista",
  "a lista não trouxe a proposta da Barba Log",
);

const larguraLista = await pg.evaluate(
  () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
);
checar(larguraLista, "lista sem overflow horizontal em 390px", "a lista estoura a largura da tela");

/* ───────────── 2. criar ───────────── */
console.log("\n▸ criar proposta");
await pg.goto(`${BASE}/admin/nova`, { waitUntil: "networkidle" });
await pg.fill("#empresa", EMPRESA);
await pg.fill("#contato", "Fulano de Teste");
await pg.fill("#tituloProjeto", "Site institucional");
await pg.click('main button[type="submit"]');
await pg.waitForURL(/\/admin\/[0-9a-f-]{36}$/, { timeout: 15000 });

const idNovo = pg.url().split("/").pop();
checar(Boolean(idNovo), "proposta criada e editor aberto", "não chegou no editor depois de criar");

/* ───────────── 3. o alicerce ───────────── */
console.log("\n▸ alicerce pré-preenchido");
const resumos = await pg.evaluate(() =>
  [...document.querySelectorAll("details > summary")].map((s) => s.innerText.replace(/\s+/g, " ")),
);
const preenchidas = resumos.filter((r) => r.includes("preenchida"));
const faltando = resumos.filter((r) => r.includes("falta preencher"));

checar(
  preenchidas.length >= 8,
  `${preenchidas.length} seções já vêm preenchidas`,
  `só ${preenchidas.length} seções preenchidas: o modelo não foi aplicado`,
);
checar(
  faltando.length === 4,
  `${faltando.length} seções marcadas como do cliente (entendimento, solução, escopo, cronograma)`,
  `${faltando.length} seções pendentes, esperava 4`,
);
for (const rotulo of ["Suporte após a entrega", "Como o pagamento funciona", "Programa de indicação"]) {
  checar(
    resumos.some((r) => r.includes(rotulo) && r.includes("preenchida")),
    `"${rotulo}" veio do modelo`,
    `"${rotulo}" não veio preenchida`,
  );
}

/* ───────────── 4. editar e publicar ───────────── */
console.log("\n▸ editar");
await pg.selectOption("select", "enviada");
await pg.click('button:has-text("Salvar")');
await pg.waitForTimeout(1500);
checar(
  (await pg.content()).includes("Salvo"),
  "status salvo pelo editor de cabeçalho",
  "o salvamento do cabeçalho não confirmou",
);

/* ───────────── 5. a proposta pública ───────────── */
console.log("\n▸ proposta pública");
const caminho = await pg.evaluate(() => {
  const link = [...document.querySelectorAll("a")].find((a) => a.textContent === "Ver a proposta");
  return link?.getAttribute("href") ?? "";
});
checar(caminho.length > 12, `link público gerado (${caminho})`, "não achei o link público no editor");

const api = await request.newContext();
const publica = await api.get(`${BASE}${caminho}`);
const htmlPublica = await publica.text();
checar(publica.status() === 200, "proposta pública responde 200", `respondeu ${publica.status()}`);
checar(htmlPublica.includes(EMPRESA), "a empresa aparece na página", "o nome da empresa não veio");
for (const secao of ["Suporte", "pagamento", "indicação"]) {
  checar(
    htmlPublica.toLowerCase().includes(secao.toLowerCase()),
    `seção "${secao}" renderizada`,
    `seção "${secao}" não apareceu na página`,
  );
}

const pdf = await api.get(`${BASE}${caminho}/pdf`);
const corpo = await pdf.body();
checar(pdf.status() === 200, "PDF da proposta nova responde", `PDF respondeu ${pdf.status()}`);
checar(corpo.subarray(0, 4).toString() === "%PDF", "PDF válido", "o corpo não começa com %PDF");
const paginas = corpo.toString("latin1").split("/Type /Page").length - 1;
checar(paginas >= 3, `${paginas - 1} páginas`, `só ${paginas - 1} páginas`);

/* Token errado na proposta nova continua sendo 404 genérico. */
const errado = await api.get(`${BASE}${caminho.slice(0, -10)}0000000000`);
checar(errado.status() === 404, "token errado dá 404", `token errado devolveu ${errado.status()}`);
await api.dispose();

checar(erros.length === 0, "console sem erros", `${erros.length} erro(s)`, erros.slice(0, 2).join("\n"));

await pg.screenshot({ path: ".playwright/admin-editor.png", fullPage: false });
await pg.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await pg.screenshot({ path: ".playwright/admin-lista.png", fullPage: false });
await ctx.close();
await navegador.close();

/* ───────────── 6. limpeza ───────────── */
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const apagadas = await sql`delete from propostas where cliente->>'empresa' = ${EMPRESA} returning slug`;
await sql.end();
console.log(`\n▸ limpeza\n  ok    ${apagadas.length} proposta(s) de teste removida(s)`);

console.log(
  falhas === 0
    ? "\n✓ tudo passou, screenshots do painel em .playwright/\n"
    : `\n✗ ${falhas} verificação(ões) falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
