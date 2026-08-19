/**
 * Validação do painel, de ponta a ponta.
 *
 *   npm run valida:admin        (com o dev server no ar)
 *
 * Percorre o caminho real de quem monta uma proposta: entrar, criar, conferir
 * que o alicerce veio preenchido, navegar pela mesa, reordenar seção, abrir a
 * paleta de comando, publicar, abrir o link público e gerar o PDF. No fim, apaga
 * a proposta de teste.
 *
 * Duas larguras, de propósito: a lista e a criação são conferidas em 390px, que
 * é onde metade do uso acontece; a mesa é conferida em 1440px, porque a prévia
 * ao vivo só existe a partir de 1280px.
 */
import { createHmac, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
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

/* ───────────── 0. a senha ─────────────
   O login precisa ser testado de verdade, e não pela senha do operador: ela é
   dele e não entra em script. A saída é trocar o hash por um sorteado na hora,
   entrar com ele e devolver o arquivo ao estado original.

   Testar isso não é zelo excessivo. O hash já chegou truncado ao servidor uma
   vez, porque o carregador de ambiente do Next expande cifrão como variável, e o
   sintoma foi "senha incorreta" com a senha certa, sem uma linha de log. Todo o
   resto do painel estava verde enquanto a porta da frente não abria.

   Um segundo servidor numa porta própria seria mais limpo, mas o Next 16 recusa
   dois `next dev` no mesmo diretório. */
const ARQUIVO_ENV = ".env.local";
const COPIA_ENV = ".env.local.bak";
const envOriginal = readFileSync(ARQUIVO_ENV, "utf8");

/* Cópia em DISCO antes de tocar no arquivo. O `finally` restaura no caminho
   normal, mas processo morto por Ctrl+C não roda finally nenhum, e aí a senha do
   operador teria sumido sem deixar rastro. Com a cópia, o `npm run conferir`
   avisa que sobrou uma restauração pendente. */
writeFileSync(COPIA_ENV, envOriginal, "utf8");

const senhaDeTeste = randomBytes(12).toString("hex");
const salDeTeste = randomBytes(16).toString("hex");
const hashDeTeste = `scrypt:${salDeTeste}:${scryptSync(senhaDeTeste, salDeTeste, 64).toString("hex")}`;

console.log("\n▸ entrar com senha");
const navegadorSenha = await chromium.launch();
try {
  writeFileSync(
    ARQUIVO_ENV,
    envOriginal.replace(/^ADMIN_SENHA_HASH=.*$/m, `ADMIN_SENHA_HASH=${hashDeTeste}`),
    "utf8",
  );

  const paginaSenha = await (await navegadorSenha.newContext()).newPage();
  let entrou = false;

  /* O Next recarrega o .env sozinho, mas leva alguns segundos. Em vez de dormir
     um tempo arbitrário, tenta entrar até conseguir. */
  for (let tentativa = 0; tentativa < 15 && !entrou; tentativa++) {
    await paginaSenha.goto(`${BASE}/painel`, { waitUntil: "networkidle" });

    /* Com sessão aberta, /admin/entrar redireciona para /admin e não existe
       campo de senha nenhum para preencher. Isso é o login tendo funcionado na
       tentativa anterior, não falha. */
    /* Sem campo de senha na tela: a sessão já está aberta e o painel mostrou a
       lista. É o login tendo funcionado, não falha. */
    if ((await paginaSenha.locator("#senha").count()) === 0) {
      entrou = true;
      break;
    }

    await paginaSenha.fill("#senha", senhaDeTeste);
    await paginaSenha.click('button[type="submit"]');
    await paginaSenha.waitForTimeout(2000);
    entrou = (await paginaSenha.locator("#senha").count()) === 0;
  }
  checar(
    entrou,
    "senha certa entra no painel",
    "senha certa não entrou: o hash não chegou inteiro ao servidor",
  );

  if (entrou) {
    await paginaSenha.context().clearCookies();
    await paginaSenha.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
    await paginaSenha.fill("#senha", "senha-obviamente-errada");
    await paginaSenha.click('button[type="submit"]');
    await paginaSenha.waitForTimeout(1200);
    checar(
      (await paginaSenha.content()).includes("Senha incorreta"),
      "senha errada é recusada",
      "senha errada não mostrou mensagem de recusa",
    );
  }
} finally {
  await navegadorSenha.close();
  try {
    writeFileSync(ARQUIVO_ENV, envOriginal, "utf8");
    const conferido = readFileSync(ARQUIVO_ENV, "utf8") === envOriginal;
    if (conferido) rmSync(COPIA_ENV, { force: true });
    console.log(
      conferido
        ? "  ok    senha do operador devolvida ao .env.local"
        : "  FALHA o .env.local NÃO voltou ao original, confira antes de continuar",
    );
    if (!conferido) falhas++;
  } catch (erro) {
    falhas++;
    console.log(`  FALHA não consegui restaurar o .env.local: ${erro.message}`);
  }
}

const EMPRESA = "Cliente de Teste E2E";
const navegador = await chromium.launch();
const errosDeConsole = [];

/* ───────────── 1. lista e criação, em 390px ───────────── */
console.log("\n▸ lista em 390px");
const ctxCelular = await navegador.newContext({ ...iPhone });
await ctxCelular.addCookies([cookieSessao]);
const cel = await ctxCelular.newPage();
cel.on("pageerror", (e) => errosDeConsole.push(String(e)));

await cel.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
checar(
  cel.url().endsWith("/painel"),
  "sessão assinada entra no painel",
  `caiu em ${cel.url()}: o cookie assinado deveria ser aceito`,
);
checar(
  (await cel.content()).includes("Barba Log"),
  "a proposta semeada aparece na lista",
  "a lista não trouxe a proposta da Barba Log",
);
checar(
  await cel.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  ),
  "lista sem overflow horizontal",
  "a lista estoura a largura da tela",
);

const alvosPequenos = await cel.evaluate(() =>
  [...document.querySelectorAll("a, button, input, select")]
    .filter((e) => {
      const b = e.getBoundingClientRect();
      return b.height > 0 && b.height < 44;
    })
    .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent ?? "").trim().slice(0, 20)}"`),
);
checar(
  alvosPequenos.length === 0,
  "todos os alvos de toque do painel têm 44px",
  `${alvosPequenos.length} alvo(s) abaixo de 44px`,
  alvosPequenos.slice(0, 4).join(", "),
);

console.log("\n▸ criar proposta");
await cel.goto(`${BASE}/painel/nova`, { waitUntil: "networkidle" });
await cel.fill("#empresa", EMPRESA);
await cel.fill("#contato", "Fulano de Teste");
await cel.fill("#tituloProjeto", "Site institucional");
await cel.click('main button[type="submit"]');
await cel.waitForURL(/\/painel\/[0-9a-f-]{36}$/, { timeout: 20000 });
const idNovo = cel.url().split("/").pop();
checar(Boolean(idNovo), "proposta criada e mesa aberta", "não chegou na mesa depois de criar");
await ctxCelular.close();

/* ───────────── 2. a mesa, em 1440px ───────────── */
console.log("\n▸ mesa em 1440px");
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 950 } });
await ctx.addCookies([cookieSessao]);
const pg = await ctx.newPage();
pg.on("pageerror", (e) => errosDeConsole.push(String(e)));
await pg.goto(`${BASE}/painel/${idNovo}`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);

const trilho = await pg.evaluate(() =>
  [...document.querySelectorAll('nav[aria-label="Seções da proposta"] > div')].map((d) => ({
    rotulo: d.innerText.replace(/\s+/g, " ").trim(),
    estado: d.querySelector("span[title]")?.getAttribute("title") ?? "",
  })),
);
checar(
  trilho.length === 16,
  `trilho com ${trilho.length} entradas (capa + 15 seções)`,
  `trilho veio com ${trilho.length} entradas, esperava 16`,
);
checar(
  trilho.filter((t) => t.estado === "falta preencher").length === 4,
  "as 4 seções do cliente aparecem como pendentes",
  `${trilho.filter((t) => t.estado === "falta preencher").length} pendentes, esperava 4`,
);
checar(
  trilho.filter((t) => t.estado === "preenchida").length >= 10,
  `${trilho.filter((t) => t.estado === "preenchida").length} seções já vêm do modelo`,
  "o modelo não preencheu as seções esperadas",
);

const prontidao = await pg.evaluate(() => {
  const bloco = [...document.querySelectorAll("button")].find((b) =>
    b.innerText.toLowerCase().includes("prontidão"),
  );
  return bloco?.innerText.replace(/\s+/g, " ") ?? "";
});
checar(
  prontidao.includes("pendência"),
  `prontidão aponta o que falta (${prontidao.trim().slice(0, 44)})`,
  "o medidor de prontidão não apareceu",
);

/* A prévia precisa ser a proposta de verdade, não um quadro em branco. */
const previa = await pg.evaluate(() => {
  const q = document.querySelector("iframe");
  return {
    existe: Boolean(q),
    altura: q?.contentDocument?.body?.scrollHeight ?? 0,
  };
});
checar(previa.existe, "prévia ao vivo presente em 1440px", "não há prévia na mesa");
checar(
  previa.altura > 1000,
  `prévia renderizou a proposta (${previa.altura}px de altura)`,
  "a prévia veio vazia: algum cabeçalho está bloqueando o iframe?",
);

/* paleta de comando */
await pg.click("h1");
await pg.keyboard.press("Control+k");
await pg.waitForTimeout(400);
await pg.keyboard.type("pgm");
await pg.waitForTimeout(300);
const achados = await pg.evaluate(() =>
  [...document.querySelectorAll('[role="dialog"] li button')].map((b) =>
    b.innerText.replace(/\s+/g, " "),
  ),
);
checar(
  achados.some((a) => a.toLowerCase().includes("indicação")),
  "⌘K acha por subsequência (pgm → Programa de indicação)",
  "⌘K não encontrou a seção pelo atalho de letras",
  achados.slice(0, 3).join(" | "),
);
await pg.keyboard.press("Escape");
await pg.waitForTimeout(300);
checar(
  await pg.evaluate(() => !document.querySelector('[role="dialog"]')),
  "esc fecha a paleta",
  "a paleta continuou aberta depois do esc",
);

/* Reordenar: desce a primeira seção e confere que a ordem sobreviveu ao F5. */
const primeiraAntes = trilho[1]?.rotulo ?? "";
await pg.evaluate(() => {
  const linhas = [...document.querySelectorAll('nav[aria-label="Seções da proposta"] > div')];
  linhas[1]?.querySelector('button[aria-label^="Descer"]')?.click();
});
await pg.waitForTimeout(2000);
await pg.reload({ waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
const primeiraDepois = await pg.evaluate(
  () =>
    document
      .querySelectorAll('nav[aria-label="Seções da proposta"] > div')[1]
      ?.innerText.replace(/\s+/g, " ")
      .trim() ?? "",
);
checar(
  primeiraDepois !== primeiraAntes && primeiraDepois.length > 0,
  "ordem das seções sobrevive ao recarregar",
  "a ordem voltou ao que era: o conteudo.ordem não gravou",
);

/* ───────────── 3. rascunho ───────────── */
console.log("\n▸ rascunho");
const caminhoRascunho = await pg.evaluate(() => {
  const link = [...document.querySelectorAll("a")].find((a) => a.textContent === "Ver proposta");
  return link?.getAttribute("href") ?? "";
});
const comSessao = await pg.goto(`${BASE}${caminhoRascunho}`);
checar(
  comSessao?.status() === 200,
  "rascunho abre para quem tem sessão de admin",
  `rascunho devolveu ${comSessao?.status()} para o admin`,
);
checar(
  (await pg.content()).includes("só você está vendo"),
  "aviso de rascunho aparece na prévia",
  "a prévia do rascunho não avisa que é rascunho",
);

const anonimo = await request.newContext();
const semSessao = await anonimo.get(`${BASE}${caminhoRascunho}`);
checar(
  semSessao.status() === 404,
  "rascunho continua 404 para quem não tem sessão",
  `rascunho devolveu ${semSessao.status()} sem sessão: proposta pela metade estaria pública`,
);
await anonimo.dispose();

/* ───────────── 4. publicar pela capa ───────────── */
console.log("\n▸ publicar");
await pg.goto(`${BASE}/painel/${idNovo}`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
await pg.evaluate(() => {
  const capa = [...document.querySelectorAll('nav[aria-label="Seções da proposta"] button')].find(
    (b) => b.innerText.includes("Cliente e datas"),
  );
  capa?.click();
});
await pg.waitForTimeout(800);
await pg.selectOption("select", "enviada");
await pg.click('button:has-text("Salvar capa")');
await pg.waitForTimeout(2000);
checar(
  (await pg.content()).includes("salvo"),
  "capa salva pelo editor",
  "o salvamento da capa não confirmou",
);

/* ───────────── 5. a proposta pública ───────────── */
console.log("\n▸ proposta pública");
const api = await request.newContext();
const publica = await api.get(`${BASE}${caminhoRascunho}`);
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

const pdf = await api.get(`${BASE}${caminhoRascunho}/pdf`);
const corpo = await pdf.body();
checar(pdf.status() === 200, "PDF da proposta nova responde", `PDF respondeu ${pdf.status()}`);
checar(corpo.subarray(0, 4).toString() === "%PDF", "PDF válido", "o corpo não começa com %PDF");
const paginas = corpo.toString("latin1").split("/Type /Page").length - 1;
checar(paginas >= 3, `${paginas - 1} páginas`, `só ${paginas - 1} páginas`);

const errado = await api.get(`${BASE}${caminhoRascunho.slice(0, -10)}0000000000`);
checar(errado.status() === 404, "token errado dá 404", `token errado devolveu ${errado.status()}`);
await api.dispose();

checar(
  errosDeConsole.length === 0,
  "console sem erros",
  `${errosDeConsole.length} erro(s)`,
  errosDeConsole.slice(0, 2).join("\n"),
);

await pg.goto(`${BASE}/painel/${idNovo}`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
await pg.screenshot({ path: ".playwright/admin-mesa.png" });
await pg.goto(`${BASE}/painel`, { waitUntil: "networkidle" });
await pg.screenshot({ path: ".playwright/admin-lista.png" });

/* ───────────── 6. excluir ───────────── */
/* A limpeza acontece PELO BOTÃO, não por SQL. Assim o teste que arruma a casa
   também prova que excluir funciona, incluindo a confirmação em dois passos. */
console.log("\n▸ excluir");
/* O clique é ancorado NA LINHA da proposta de teste, nunca num botão solto.
   A versão anterior filtrava a lista e clicava no primeiro "Excluir" da tela,
   o que só funciona enquanto o filtro funciona: numa rodada em que a criação
   falhou, o filtro não escondeu nada e o primeiro "Excluir" era de uma proposta
   de verdade. Apagou. Ancorar na linha torna esse acidente impossível. */
await pg.fill('input[placeholder^="Buscar"]', EMPRESA);
await pg.waitForTimeout(400);
const linhaDeTeste = pg.locator("li").filter({ hasText: EMPRESA });
const quantasLinhas = await linhaDeTeste.count();
checar(
  quantasLinhas === 1,
  "a linha da proposta de teste foi isolada antes de excluir",
  `a busca deixou ${quantasLinhas} linha(s) na tela: não dá para excluir com segurança`,
);
if (quantasLinhas !== 1) {
  console.log("  ▸ pulando a exclusão pela tela para não apagar proposta de verdade");
} else {
  await linhaDeTeste.getByRole("button", { name: "Excluir", exact: true }).click();
  await pg.waitForTimeout(300);
  checar(
    await pg.evaluate(() => Boolean(document.querySelector("dialog[open]"))),
    "excluir abre modal de confirmação",
    "o botão excluiu sem abrir a modal",
  );
  await pg.click('dialog button:has-text("Excluir para sempre")');
  await pg.waitForTimeout(2500);
}

await ctx.close();
await navegador.close();

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const [{ sobraram }] = await sql`
  select count(*)::int as sobraram from propostas where cliente->>'empresa' = ${EMPRESA}
`;
/* Rede de segurança: se o botão falhou, a proposta de teste não pode ficar no
   banco atrapalhando a próxima rodada. */
if (sobraram > 0) await sql`delete from propostas where cliente->>'empresa' = ${EMPRESA}`;
await sql.end();
checar(
  sobraram === 0,
  "proposta de teste excluída pelo painel",
  `a proposta continuou no banco (${sobraram}), removida por SQL como remendo`,
);

console.log(
  falhas === 0
    ? "\n✓ tudo passou, screenshots do painel em .playwright/\n"
    : `\n✗ ${falhas} verificação(ões) falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
