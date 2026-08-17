/**
 * Validação mobile-first — roda ao final de cada fase.
 *
 *   npm run valida:mobile            (usa http://localhost:3000)
 *   npm run valida:mobile -- <url>
 *
 * Verifica, num viewport real de 390×844 (iPhone 14):
 *   1. overflow horizontal
 *   2. alvos de toque abaixo de 44px (links inline em frase são isentos — WCAG 2.5.8)
 *   3. `100vh` em qualquer regra (o projeto usa só `dvh`)
 *   4. reveals travados invisíveis
 *   5. as animações scroll-driven realmente instanciadas (e não o fallback)
 *   6. títulos de seção sticky funcionando
 *   7. prefers-reduced-motion: nada animado e tudo visível
 *   8. mídia print: nenhuma seção em branco, <details> abertos, paleta invertida
 *   9. foco de teclado visível
 * e salva screenshots e um PDF em .playwright/ para conferência visual.
 */
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CAMINHO = "/barba-log-7fk2m9x4qd";
const SAIDA = ".playwright";

const iPhone = devices["iPhone 14"];
let falhas = 0;

/** Encapsula a asserção numa chamada de função — mantém o ESLint feliz. */
function checar(condicao, textoOk, textoFalha = textoOk, extra = "") {
  if (condicao) {
    console.log(`  ok    ${textoOk}`);
  } else {
    falhas++;
    console.log(`  FALHA ${textoFalha}${extra ? `\n        ${extra}` : ""}`);
  }
}


/**
 * O convite cobre a proposta na abertura. Toda verificação abaixo precisa da
 * proposta em cena, então cada contexto o dispensa antes de medir — e de quebra
 * isso testa que o botão do convite realmente funciona.
 */
async function abrirProposta(pagina) {
  // Seletor estrutural, não por rótulo: o texto do botão já mudou duas vezes e
  // cada mudança fazia o teste "passar" sem nunca dispensar o convite.
  const botao = pagina.locator("#convite button").first();
  if (await botao.count()) {
    await botao.click();
    // O convite só sai de cena depois da própria animação de saída, então
    // esperamos a remoção antes de qualquer medição.
    await pagina.locator("#convite").waitFor({ state: "detached", timeout: 8000 });
    // E então a animação de ENTRADA da proposta. Medir antes disso lê tudo
    // através do `scale(0.96)` do wrapper — um alvo de 44px aparece como
    // 43,7px e vira falha falsa.
    await pagina.evaluate(async () => {
      const alvo = document.querySelector(".proposta-entrando");
      if (!alvo) return;
      await Promise.all(alvo.getAnimations().map((a) => a.finished.catch(() => {})));
    });
    await pagina.waitForTimeout(150);
  }
  return pagina.locator("#convite").count();
}

await mkdir(SAIDA, { recursive: true });
const navegador = await chromium.launch();

/* ───────────── 1. viewport 390×844, sem reduced-motion ───────────── */
console.log(`\n▸ 390×844 (iPhone 14) — ${BASE}${CAMINHO}`);
const ctx = await navegador.newContext({ ...iPhone });
const pg = await ctx.newPage();
const erros = [];
pg.on("console", (m) => m.type() === "error" && erros.push(m.text()));
pg.on("pageerror", (e) => erros.push(String(e)));
await pg.goto(BASE + CAMINHO, { waitUntil: "networkidle" });

const conviteRestante = await abrirProposta(pg);
checar(conviteRestante === 0, "convite abre e sai de cena ao clicar", "o convite continuou no DOM depois do clique");

const vp = pg.viewportSize();
checar(vp.width === 390, `viewport real de ${vp.width}×${vp.height}`, `viewport inesperado: ${vp.width}`);

const overflow = await pg.evaluate(() => {
  const d = document.documentElement;
  const culpados = [...document.querySelectorAll("body *")]
    .filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1)
    .slice(0, 5)
    .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`);
  return { estoura: d.scrollWidth > d.clientWidth + 1, largura: d.scrollWidth, culpados };
});
checar(!overflow.estoura, "sem overflow horizontal", `overflow horizontal (${overflow.largura}px)`, overflow.culpados.join(", "));

const alvos = await pg.evaluate(() => {
  // Link inline no meio de uma frase é isento (WCAG 2.5.8) — aumentá-lo
  // quebraria o parágrafo em vez de melhorar a operação por toque.
  const inlineEmFrase = (e) => {
    if (e.tagName !== "A") return false;
    const pai = e.parentElement;
    return !!pai && /^(P|LI|SPAN|STRONG|EM)$/.test(pai.tagName) && (pai.textContent ?? "").trim().length > e.textContent.trim().length + 10;
  };
  // O alvo real de um input dentro de <label> é o label inteiro.
  const areaAcionavel = (e) => {
    const rotulo = e.tagName === "INPUT" ? e.closest("label") : null;
    return (rotulo ?? e).getBoundingClientRect();
  };
  return [...document.querySelectorAll("a, button, summary, label, input")]
    .filter((e) => {
      const b = areaAcionavel(e);
      return b.height > 0 && (b.height < 44 || b.width < 44) && !inlineEmFrase(e);
    })
    .map((e) => {
      const b = areaAcionavel(e);
      return `${e.tagName.toLowerCase()} "${(e.textContent ?? "").trim().slice(0, 28)}" ${Math.round(b.width)}×${Math.round(b.height)}`;
    });
});
checar(alvos.length === 0, "todos os alvos de toque ≥ 44px (links inline isentos)", `${alvos.length} alvo(s) abaixo de 44px`, alvos.join("\n        "));

const vh = await pg.evaluate(() => {
  const achados = [];
  for (const folha of document.styleSheets) {
    try {
      for (const regra of folha.cssRules) {
        const t = regra.cssText ?? "";
        if (/\b\d+vh\b/.test(t)) achados.push(t.slice(0, 90));
      }
    } catch {}
  }
  return achados.slice(0, 5);
});
checar(vh.length === 0, "nenhum uso de 100vh (só dvh)", "uso de vh encontrado", vh.join("\n        "));

/* animações realmente rodando, e não o fallback do @supports */
const motor = await pg.evaluate(() => {
  const tipos = {};
  for (const a of document.getAnimations()) {
    const t = a.timeline ? a.timeline.constructor.name : "sem-timeline";
    tipos[t] = (tipos[t] ?? 0) + 1;
  }
  return {
    guard: CSS.supports("((animation-timeline: view()) and (animation-range: 0% 100%))"),
    tipos,
    scroll: tipos.ScrollTimeline ?? 0,
    view: tipos.ViewTimeline ?? 0,
  };
});
checar(motor.guard, "guard do @supports satisfeito", "guard do @supports falhou — a página está no fallback estático");
checar(motor.scroll > 0 && motor.view > 0, `scroll-driven ativo (${motor.scroll} ScrollTimeline, ${motor.view} ViewTimeline)`, "nenhuma animação scroll-driven instanciada", JSON.stringify(motor.tipos));

/* Títulos de seção NÃO podem voltar a ser sticky: comiam a viewport do celular
   e disputavam atenção com o conteúdo. */
const grudados = await pg.evaluate(() =>
  [...document.querySelectorAll("section header, [data-sticky]")]
    .filter((e) => getComputedStyle(e).position === "sticky").length,
);
checar(grudados === 0, "nenhum título de seção sticky", `${grudados} título(s) voltaram a ser sticky`);

/* A separação entre seções é SECA: só a troca de cor de fundo, sem gradiente,
   sem blur e sem curva. */
const separacao = await pg.evaluate(() => {
  const blocos = [...document.querySelectorAll("main > div")];
  const cores = blocos.map((b) => getComputedStyle(b).backgroundColor);
  const comGradiente = blocos.filter((b) => getComputedStyle(b).backgroundImage !== "none").length;
  const comBlur = blocos.filter((b) => getComputedStyle(b).filter !== "none").length;
  return { blocos: blocos.length, distintas: new Set(cores).size, comGradiente, comBlur };
});
checar(separacao.blocos > 0 && separacao.distintas === 2, `${separacao.blocos} seções alternando entre 2 tons`, `esperava 2 tons alternados, encontrei ${separacao.distintas}`);
checar(separacao.comGradiente === 0 && separacao.comBlur === 0, "divisão seca (sem gradiente e sem blur)", `${separacao.comGradiente} com gradiente, ${separacao.comBlur} com blur`);

/* A seção travada precisa de fato travar: contêiner alto + filho sticky. */
const travada = await pg.evaluate(() => {
  const secao = document.querySelector("#processo");
  if (!secao) return null;
  const alto = [...secao.querySelectorAll("div")].find((d) => d.getBoundingClientRect().height > innerHeight * 2);
  const grudado = [...secao.querySelectorAll("div")].some((d) => getComputedStyle(d).position === "sticky");
  return { alto: !!alto, grudado, altura: alto ? Math.round(alto.getBoundingClientRect().height) : 0 };
});
checar(!!travada && travada.alto && travada.grudado, `seção do processo trava (${travada?.altura}px de percurso)`, "a seção do processo não está travando");

/* Os reveals por mola do motion precisam existir de fato. */
const molas = await pg.evaluate(
  () => document.getAnimations().filter((a) => !a.timeline || a.timeline.constructor.name === "DocumentTimeline").length,
);
checar(molas > 0, `${molas} animações por tempo (motion) ativas`, "nenhuma animação por tempo — os reveals do motion não dispararam");

await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pg.waitForTimeout(800);
const invisiveis = await pg.evaluate(() =>
  [...document.querySelectorAll("[data-reveal], [data-stagger] > *, .palavra-sobe")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05)
    .map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]),
);
checar(invisiveis.length === 0, "nenhum reveal travado invisível após o scroll", `${invisiveis.length} elemento(s) invisíveis`, invisiveis.slice(0, 6).join(", "));

await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(500);
await pg.screenshot({ path: `${SAIDA}/390-hero.png` });
await pg.screenshot({ path: `${SAIDA}/390-inteira.png`, fullPage: true });
checar(erros.length === 0, "console sem erros", `${erros.length} erro(s) no console`, erros.slice(0, 3).join("\n        "));
await ctx.close();

/* ───────────── 2. prefers-reduced-motion: reduce ───────────── */
console.log("\n▸ prefers-reduced-motion: reduce");
const ctxRm = await navegador.newContext({ ...iPhone, reducedMotion: "reduce" });
const pgRm = await ctxRm.newPage();
await pgRm.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await abrirProposta(pgRm);
await pgRm.waitForTimeout(600);

const movimento = await pgRm.evaluate(() => {
  const animando = [];
  for (const e of document.querySelectorAll("*")) {
    const s = getComputedStyle(e);
    if (s.animationName !== "none") animando.push(e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]);
  }
  const escondidos = [...document.querySelectorAll("[data-reveal], [data-stagger] > *, .palavra-sobe, .assinatura-nome")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99)
    .map((e) => e.tagName.toLowerCase());
  const transformados = [...document.querySelectorAll(".palavra-sobe, .filete-secao, .barra-fase, .linha-tempo, .borda-topo, .onda-mare")]
    .filter((e) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(e).transform))
    .map((e) => (e.className || "").toString().split(" ")[0]);
  return { animando: animando.slice(0, 6), escondidos: escondidos.slice(0, 6), transformados: transformados.slice(0, 6), vivas: document.getAnimations().length };
});
checar(movimento.animando.length === 0, "nada animando", `${movimento.animando.length} elemento(s) ainda com animação`, movimento.animando.join(", "));
checar(movimento.escondidos.length === 0, "todo conteúdo visível", "conteúdo escondido com reduced-motion", movimento.escondidos.join(", "));
checar(movimento.transformados.length === 0, "nenhum transform residual (filetes e bordas em estado final)", "transform residual com reduced-motion", movimento.transformados.join(", "));

await pgRm.screenshot({ path: `${SAIDA}/390-reduced-motion.png`, fullPage: true });
await ctxRm.close();

/* ───────────── 3. mídia print (é o PDF do cliente) ───────────── */
console.log("\n▸ @media print");
const ctxP = await navegador.newContext({ ...iPhone });
const pgP = await ctxP.newPage();
await pgP.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await abrirProposta(pgP);
await pgP.emulateMedia({ media: "print" });
await pgP.waitForTimeout(500);

const impressao = await pgP.evaluate(() => {
  const emBranco = [...document.querySelectorAll("section, [data-reveal], [data-stagger] > *, .palavra-sobe")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === "hidden")
    .map((e) => e.id || (e.className || "").toString().split(" ")[0] || e.tagName.toLowerCase());
  const grudados = [...document.querySelectorAll("*")]
    .filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position))
    .map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]);
  const cortados = [...document.querySelectorAll(".palavra-clip")]
    .filter((e) => getComputedStyle(e).overflow !== "visible").length;
  const rodape = document.querySelector(".print-only");
  return {
    emBranco: emBranco.slice(0, 8),
    grudados: grudados.slice(0, 5),
    cortados,
    fundo: getComputedStyle(document.body).backgroundColor,
    rodapeVisivel: rodape ? getComputedStyle(rodape).display !== "none" : false,
    detalhes: document.querySelectorAll("details").length,
  };
});
checar(impressao.emBranco.length === 0, "nenhuma seção sai em branco", "seções invisíveis na impressão", impressao.emBranco.join(", "));
checar(impressao.grudados.length === 0, "nada fixed/sticky", "elementos grudados na impressão", impressao.grudados.join(", "));
checar(impressao.cortados === 0, "recorte das palavras liberado no papel", `${impressao.cortados} título(s) ainda com recorte`);
checar(/rgb\(255,\s*255,\s*255\)/.test(impressao.fundo), `paleta invertida (fundo ${impressao.fundo})`, `fundo de impressão não é branco: ${impressao.fundo}`);
checar(impressao.rodapeVisivel, "rodapé .print-only visível (URL e validade)", "rodapé .print-only não aparece na impressão");

await pgP.emulateMedia({ media: "screen" });
await pgP.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await pgP.emulateMedia({ media: "print" });
const abertos = await pgP.evaluate(() => document.querySelectorAll("details[open]").length);
checar(abertos === impressao.detalhes, `todos os ${abertos} blocos expansíveis abertos para o PDF`, `só ${abertos} de ${impressao.detalhes} blocos abertos`);

await pgP.pdf({ path: `${SAIDA}/proposta.pdf`, format: "A4", printBackground: false });
console.log("  ok    PDF gerado em .playwright/proposta.pdf");
await ctxP.close();

/* ───────────── 4. foco de teclado ───────────── */
console.log("\n▸ foco de teclado");
const ctxK = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pgK = await ctxK.newPage();
await pgK.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await abrirProposta(pgK);
await pgK.keyboard.press("Tab");
await pgK.keyboard.press("Tab");
const foco = await pgK.evaluate(() => {
  const e = document.activeElement;
  // nextjs-portal é o overlay de desenvolvimento, não faz parte da página
  if (!e || e === document.body || e.tagName.toLowerCase() === "nextjs-portal") return null;
  const s = getComputedStyle(e);
  return { elemento: e.tagName.toLowerCase(), outline: s.outlineWidth, cor: s.outlineColor, estilo: s.outlineStyle };
});
checar(
  !!foco && foco.estilo !== "none" && parseFloat(foco.outline) > 0,
  foco ? `foco visível em <${foco.elemento}> (${foco.outline} ${foco.cor})` : "foco visível",
  "foco de teclado sem contorno visível",
  JSON.stringify(foco),
);
await ctxK.close();

await navegador.close();

console.log(
  falhas === 0
    ? `\n✓ tudo passou — screenshots e PDF em ${SAIDA}/\n`
    : `\n✗ ${falhas} verificação(ões) falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
