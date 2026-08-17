/**
 * Validação mobile-first — roda ao final de cada fase.
 *
 *   npm run valida:mobile            (usa http://localhost:3000)
 *   npm run valida:mobile -- <url>
 *
 * Verifica, num viewport real de 390×844:
 *   1. overflow horizontal
 *   2. alvos de toque abaixo de 44px (links inline em frase são isentos — WCAG 2.5.8)
 *   3. `100vh` em qualquer regra de estilo (o projeto usa só `dvh`)
 *   4. reveals travados invisíveis
 *   5. prefers-reduced-motion: nada animado e tudo visível
 *   6. mídia print: nenhuma seção em branco e todos os <details> abertos
 *   7. foco de teclado visível
 * e salva screenshots em .playwright/ para conferência visual.
 */
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CAMINHO = "/barba-log-7fk2m9x4qd";
const SAIDA = ".playwright";

const iPhone = devices["iPhone 14"]; // 390×844, DPR 3, touch, sem hover
let falhas = 0;

const ok = (t) => console.log(`  ok    ${t}`);
const falhou = (t, extra = "") => {
  falhas++;
  console.log(`  FALHA ${t}${extra ? `\n        ${extra}` : ""}`);
};

await mkdir(SAIDA, { recursive: true });
const navegador = await chromium.launch();

/* ───────────── 1. viewport 390 × 844, sem reduced-motion ───────────── */
console.log(`\n▸ 390×844 (iPhone 14) — ${BASE}${CAMINHO}`);
const ctx = await navegador.newContext({ ...iPhone });
const pg = await ctx.newPage();
const erros = [];
pg.on("console", (m) => m.type() === "error" && erros.push(m.text()));
pg.on("pageerror", (e) => erros.push(String(e)));
await pg.goto(BASE + CAMINHO, { waitUntil: "networkidle" });

const viewport = pg.viewportSize();
viewport.width === 390
  ? ok(`viewport real de ${viewport.width}×${viewport.height}`)
  : falhou(`viewport inesperado: ${viewport.width}`);

const overflow = await pg.evaluate(() => {
  const d = document.documentElement;
  const culpados = [...document.querySelectorAll("body *")]
    .filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1)
    .slice(0, 5)
    .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`);
  return { estoura: d.scrollWidth > d.clientWidth + 1, largura: d.scrollWidth, culpados };
});
overflow.estoura
  ? falhou(`overflow horizontal (${overflow.largura}px)`, overflow.culpados.join(", "))
  : ok("sem overflow horizontal");

const alvos = await pg.evaluate(() => {
  // Link inline no meio de uma frase é isento (WCAG 2.5.8) — aumentá-lo
  // quebraria o parágrafo em vez de melhorar a operação por toque.
  const inlineEmFrase = (e) => {
    if (e.tagName !== "A") return false;
    const pai = e.parentElement;
    return !!pai && /^(P|LI|SPAN|STRONG|EM)$/.test(pai.tagName) && (pai.textContent ?? "").trim().length > e.textContent.trim().length + 10;
  };
  // O alvo real de um input dentro de <label> é o label inteiro: tocar em
  // qualquer ponto dele aciona o controle. É essa área que a regra mede.
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
      return `${e.tagName.toLowerCase()} "${(e.textContent ?? e.value ?? "").trim().slice(0, 28)}" ${Math.round(b.width)}×${Math.round(b.height)}`;
    });
});
alvos.length === 0
  ? ok("todos os alvos de toque ≥ 44px (links inline isentos)")
  : falhou(`${alvos.length} alvo(s) abaixo de 44px`, alvos.join("\n        "));

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
vh.length === 0 ? ok("nenhum uso de 100vh (só dvh)") : falhou("uso de vh encontrado", vh.join("\n        "));

await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pg.waitForTimeout(700);
const invisiveis = await pg.evaluate(() =>
  [...document.querySelectorAll("[data-reveal], [data-stagger] > *")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05)
    .map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]),
);
invisiveis.length === 0
  ? ok("nenhum reveal travado invisível após o scroll")
  : falhou(`${invisiveis.length} elemento(s) invisíveis`, invisiveis.slice(0, 6).join(", "));

await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(400);
await pg.screenshot({ path: `${SAIDA}/390-hero.png` });
await pg.screenshot({ path: `${SAIDA}/390-inteira.png`, fullPage: true });

erros.length === 0 ? ok("console sem erros") : falhou(`${erros.length} erro(s) no console`, erros.slice(0, 3).join("\n        "));
await ctx.close();

/* ───────────── 2. prefers-reduced-motion: reduce ───────────── */
console.log("\n▸ prefers-reduced-motion: reduce");
const ctxRm = await navegador.newContext({ ...iPhone, reducedMotion: "reduce" });
const pgRm = await ctxRm.newPage();
await pgRm.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await pgRm.waitForTimeout(500);

const movimento = await pgRm.evaluate(() => {
  const animando = [];
  for (const e of document.querySelectorAll("*")) {
    const s = getComputedStyle(e);
    if (s.animationName !== "none" || (s.transitionDuration !== "0s" && s.transitionProperty !== "none" && s.transitionProperty !== "all")) {
      animando.push(e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]);
    }
  }
  const escondidos = [...document.querySelectorAll("[data-reveal], [data-stagger] > *, .assinatura-nome")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99)
    .map((e) => e.tagName.toLowerCase());
  return { animando: animando.slice(0, 6), escondidos: escondidos.slice(0, 6) };
});
movimento.animando.length === 0 ? ok("nada animando") : falhou(`${movimento.animando.length} elemento(s) ainda com animação`, movimento.animando.join(", "));
movimento.escondidos.length === 0 ? ok("todo conteúdo visível") : falhou("conteúdo escondido com reduced-motion", movimento.escondidos.join(", "));

await pgRm.screenshot({ path: `${SAIDA}/390-reduced-motion.png`, fullPage: true });
await ctxRm.close();

/* ───────────── 3. mídia print (é o PDF do cliente) ───────────── */
console.log("\n▸ @media print");
const ctxP = await navegador.newContext({ ...iPhone });
const pgP = await ctxP.newPage();
await pgP.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await pgP.emulateMedia({ media: "print" });
await pgP.waitForTimeout(400);

const impressao = await pgP.evaluate(() => {
  const emBranco = [...document.querySelectorAll("section, [data-reveal], [data-stagger] > *")]
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === "hidden")
    .map((e) => (e.id || e.tagName.toLowerCase()));
  const grudados = [...document.querySelectorAll("*")]
    .filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position))
    .map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]);
  const rodape = document.querySelector(".print-only");
  return {
    emBranco: emBranco.slice(0, 8),
    grudados: grudados.slice(0, 5),
    fundo: getComputedStyle(document.body).backgroundColor,
    cor: getComputedStyle(document.body).color,
    rodapeVisivel: rodape ? getComputedStyle(rodape).display !== "none" : false,
    detalhes: document.querySelectorAll("details").length,
  };
});
impressao.emBranco.length === 0 ? ok("nenhuma seção sai em branco") : falhou("seções invisíveis na impressão", impressao.emBranco.join(", "));
impressao.grudados.length === 0 ? ok("nada fixed/sticky") : falhou("elementos grudados na impressão", impressao.grudados.join(", "));
/rgb\(255,\s*255,\s*255\)/.test(impressao.fundo) ? ok(`paleta invertida (fundo ${impressao.fundo})`) : falhou(`fundo de impressão não é branco: ${impressao.fundo}`);
impressao.rodapeVisivel ? ok("rodapé .print-only visível (URL e validade)") : falhou("rodapé .print-only não aparece na impressão");

// os <details> são abertos pelo listener beforeprint
await pgP.emulateMedia({ media: "screen" });
await pgP.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await pgP.emulateMedia({ media: "print" });
const abertos = await pgP.evaluate(() => document.querySelectorAll("details[open]").length);
abertos === impressao.detalhes
  ? ok(`todos os ${abertos} blocos expansíveis abertos para o PDF`)
  : falhou(`só ${abertos} de ${impressao.detalhes} blocos abertos`);

await pgP.pdf({ path: `${SAIDA}/proposta.pdf`, format: "A4", printBackground: false });
ok("PDF gerado em .playwright/proposta.pdf");
await ctxP.close();

/* ───────────── 4. foco de teclado ───────────── */
console.log("\n▸ foco de teclado");
const ctxK = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pgK = await ctxK.newPage();
await pgK.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await pgK.keyboard.press("Tab");
await pgK.keyboard.press("Tab");
const foco = await pgK.evaluate(() => {
  const e = document.activeElement;
  if (!e || e === document.body) return null;
  const s = getComputedStyle(e);
  return { elemento: e.tagName.toLowerCase(), outline: s.outlineWidth, cor: s.outlineColor, estilo: s.outlineStyle };
});
foco && foco.estilo !== "none" && parseFloat(foco.outline) > 0
  ? ok(`foco visível em <${foco.elemento}> (${foco.outline} ${foco.cor})`)
  : falhou("foco de teclado sem contorno visível", JSON.stringify(foco));
await ctxK.close();

await navegador.close();

console.log(
  falhas === 0
    ? `\n✓ tudo passou — screenshots e PDF em ${SAIDA}/\n`
    : `\n✗ ${falhas} verificação(ões) falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
