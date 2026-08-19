/**
 * Validação mobile-first, roda ao final de cada fase.
 *
 *   npm run valida:mobile            (usa http://localhost:3000)
 *   npm run valida:mobile -- <url>
 *
 * Verifica, num viewport real de 390×844 (iPhone 14):
 *   1. overflow horizontal
 *   2. alvos de toque abaixo de 44px (links inline em frase são isentos, WCAG 2.5.8)
 *   3. `100vh` em qualquer regra (o projeto usa só `dvh`)
 *   4. reveals travados invisíveis
 *   5. as animações scroll-driven realmente instanciadas (e não o fallback)
 *   6. títulos de seção sticky funcionando
 *   7. prefers-reduced-motion: nada animado e tudo visível
 *   8. mídia print: nenhuma seção em branco, <details> abertos, paleta invertida
 *   9. foco de teclado visível
 *  10. travessão em texto de cliente (proibido: ver a regra de escrita no CLAUDE.md)
 * e salva screenshots e um PDF em .playwright/ para conferência visual.
 */
import { chromium, devices, request } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CAMINHO = "/barba-log-7fk2m9x4qd";
const SAIDA = ".playwright";

const iPhone = devices["iPhone 14"];
let falhas = 0;

/** Encapsula a asserção numa chamada de função, mantém o ESLint feliz. */
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
 * proposta em cena, então cada contexto o dispensa antes de medir, e de quebra
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
    // através do `scale(0.96)` do wrapper, um alvo de 44px aparece como
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

/**
 * Rola a página como um usuário rolaria, em passos.
 *
 * `scrollTo(bottom)` de uma vez não serve: o `whileInView` do motion dispara por
 * IntersectionObserver, então tudo que foi PULADO nunca entra em tela e fica
 * legitimamente invisível. O teste então acusava falha onde não havia.
 */
async function rolarAPagina(pagina) {
  const { altura, tela } = await pagina.evaluate(() => ({
    altura: document.body.scrollHeight,
    tela: window.innerHeight,
  }));
  // O passo precisa ser MENOR que a viewport, senão o conteúdo entre um passo e
  // outro nunca chega a ficar em tela e o IntersectionObserver do motion não
  // dispara, o teste acusaria como travado algo que o usuário veria normalmente.
  const passo = Math.floor(tela * 0.7);
  for (let y = passo; y < altura; y += passo) {
    await pagina.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await pagina.waitForTimeout(130);
  }
  await pagina.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), altura - tela);
  await pagina.waitForTimeout(800);
}

await mkdir(SAIDA, { recursive: true });
const navegador = await chromium.launch();

/* ───────────── 1. viewport 390×844, sem reduced-motion ───────────── */
console.log(`\n▸ 390×844 (iPhone 14): ${BASE}${CAMINHO}`);
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
  // Link inline no meio de uma frase é isento (WCAG 2.5.8), aumentá-lo
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
checar(motor.guard, "guard do @supports satisfeito", "guard do @supports falhou, a página está no fallback estático");
/* ScrollTimeline deixou de ser exigido: `animation-timeline` só existe no iOS
   26+, então tudo que o cliente PRECISA ver migrou para `useScroll` (rAF).
   O CSS scroll-driven ficou só como decoração, daí exigir só ViewTimeline. */
checar(motor.view > 0, `decoração scroll-driven ativa (${motor.view} ViewTimeline)`, "nenhuma animação scroll-driven instanciada", JSON.stringify(motor.tipos));

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
checar(separacao.blocos > 0 && separacao.distintas === 3, `${separacao.blocos} seções em 3 tons (claro, azul claro e noite)`, `esperava 3 tons, encontrei ${separacao.distintas}`);
checar(separacao.comGradiente === 0 && separacao.comBlur === 0, "divisão seca (sem gradiente e sem blur)", `${separacao.comGradiente} com gradiente, ${separacao.comBlur} com blur`);

/* Os capítulos escuros são o que fazem o vidro existir: sobre branco chapado o
   backdrop-filter cobra GPU e não entrega nada. */
const capitulos = await pg.evaluate(() => ({
  noite: document.querySelectorAll('[data-capitulo="noite"]').length,
  comVidroDentro: [...document.querySelectorAll('[data-capitulo="noite"]')]
    .filter((c) => c.querySelector(".vidro")).length,
}));
checar(capitulos.noite >= 2, `${capitulos.noite} capítulos noite`, `esperava ao menos 2 capítulos noite, encontrei ${capitulos.noite}`);
checar(capitulos.comVidroDentro > 0, "vidro dentro de capítulo escuro (é onde ele rende)", "nenhum vidro dentro de capítulo escuro, sobre fundo claro ele não aparece");

/* A seção travada precisa de fato travar: contêiner alto + filho sticky. */
const travada = await pg.evaluate(() => {
  const secao = document.querySelector("#processo");
  if (!secao) return null;
  const alto = [...secao.querySelectorAll("div")].find((d) => d.getBoundingClientRect().height > innerHeight * 2);
  const grudado = [...secao.querySelectorAll("div")].some((d) => getComputedStyle(d).position === "sticky");
  return { alto: !!alto, grudado, altura: alto ? Math.round(alto.getBoundingClientRect().height) : 0 };
});
checar(!!travada && travada.alto && travada.grudado, `seção do processo trava (${travada?.altura}px de percurso)`, "a seção do processo não está travando");

/* WebGL é enfeite de DESKTOP. No celular nem o chunk deve ser baixado, quem
   abre pelo WhatsApp está no 4G. */
const webgl = await pg.evaluate(() => ({
  canvas: document.querySelectorAll("header canvas").length,
  contextos: [...document.querySelectorAll("canvas")].filter((c) => {
    try { return !!c.getContext("webgl"); } catch { return false; }
  }).length,
}));
checar(webgl.canvas === 0, "nenhum canvas WebGL no celular", `${webgl.canvas} canvas WebGL renderizado em 390px, deveria ser exclusivo de desktop`);

/* Orçamento de vidro: backdrop-filter é o efeito mais caro em Android
   intermediário. Teto de 5 elementos; e o prefixo -webkit- é obrigatório para
   iOS 16-17, onde a versão sem prefixo não existe. */
const vidro = await pg.evaluate(() => {
  const comVidro = [...document.querySelectorAll("*")].filter((e) => {
    const bf = getComputedStyle(e).backdropFilter;
    return bf && bf !== "none";
  });
  return { total: comVidro.length };
});
checar(vidro.total <= 5, `${vidro.total} elemento(s) com backdrop-filter (teto 5)`, `${vidro.total} elementos com backdrop-filter, o teto é 5`);

/* O prefixo NÃO dá para verificar em runtime: o Chromium trata
   `-webkit-backdrop-filter` como alias e apaga a declaração do CSSOM
   (`getPropertyValue` devolve ""). A verificação tem que ser no código-fonte. */
const fonteCss = [
  await readFile("src/app/globals.css", "utf8"),
  await readFile("src/styles/print.css", "utf8"),
].join("\n");
const blocosComVidro = [...fonteCss.matchAll(/[^{}]*\{[^{}]*backdrop-filter[^{}]*\}/g)].map((m) => m[0]);
const semPrefixo = blocosComVidro.filter(
  (b) => /(?<!-webkit-)backdrop-filter\s*:/.test(b) && !/-webkit-backdrop-filter\s*:/.test(b) && !/none/.test(b),
);
checar(semPrefixo.length === 0, `${blocosComVidro.length} bloco(s) de vidro, todos com -webkit-`, `${semPrefixo.length} bloco(s) sem -webkit-backdrop-filter (o vidro some em iOS 16-17)`, semPrefixo.map((b) => b.slice(0, 70)).join(" | "));

const utilitariaTailwind = await pg.evaluate(() =>
  [...document.querySelectorAll("[class*='backdrop-blur']")].length,
);
checar(utilitariaTailwind === 0, "nenhuma utility backdrop-blur do Tailwind", `${utilitariaTailwind} elemento(s) usam backdrop-blur-*, o Tailwind não emite o prefixo, use .vidro`);

/* Os reveals por mola do motion precisam existir de fato. */
const molas = await pg.evaluate(
  () => document.getAnimations().filter((a) => !a.timeline || a.timeline.constructor.name === "DocumentTimeline").length,
);
checar(molas > 0, `${molas} animações por tempo (motion) ativas`, "nenhuma animação por tempo, os reveals do motion não dispararam");

await rolarAPagina(pg);
/* Volta a subir a página em quatro paradas. Como o reveal repete, a pergunta
   certa não é "sobrou algo invisível no documento" e sim "ao REENTRAR numa
   dobra, tudo que está nela apareceu", que é o que o leitor vê ao voltar. */
const reveals = { total: 0, noDocumento: 0, invisiveis: [] };
for (const fracao of [0.85, 0.65, 0.45, 0.25]) {
  await pg.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), fracao);
  await pg.waitForTimeout(2000); /* mola + encadeamento da lista mais longa */
  const parada = await pg.evaluate(() => {
    // O motion/react escreve `style="opacity: N"` inline: é assim que se acha um
    // reveal de verdade. Os seletores antigos ([data-reveal], .palavra-sobe) não
    // existem no DOM há várias fases: a verificação passava inspecionando vazio.
    // `aria-hidden` é isento: são os painéis inativos da seção travada, que
    // DEVEM estar em opacity 0: é assim que um painel dá lugar ao outro.
    //
    // O reveal REPETE (`viewport.once: false`): fora da tela ele volta ao estado
    // inicial DE PROPÓSITO, para animar de novo quando o leitor sobe a página.
    // Por isso só se cobra visibilidade de quem está na viewport agora, cobrar
    // do documento inteiro reprovaria a página por fazer o que foi pedido.
    // O corte em 0.85 respeita a margem negativa de disparo: o que ainda está
    // colado na borda de baixo legitimamente não animou.
    // A folga de 64px embaixo não é frescura: ao sair da tela o reveal volta a
    // `translateY(48px)`, e esse deslocamento faz um item logo acima da dobra
    // reaparecer com uma tira de ~27px dentro da viewport. Ele está fora, e o
    // container já resetou, cobrar visibilidade dessa tira é falha falsa.
    const naTela = (e) => {
      const r = e.getBoundingClientRect();
      return r.height > 0 && r.bottom > 64 && r.top < innerHeight * 0.85;
    };
    const todos = [...document.querySelectorAll("[style*='opacity'], .palavra-clip")]
      .filter((e) => !e.closest('[aria-hidden="true"]'));
    const candidatos = todos.filter(naTela);
    const invisiveis = candidatos
      .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.05)
      .map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]} em #${e.closest("section")?.id ?? "?"}`);
    return { total: candidatos.length, noDocumento: todos.length, invisiveis };
  });
  reveals.total += parada.total;
  reveals.noDocumento = parada.noDocumento;
  reveals.invisiveis.push(...parada.invisiveis);
}
checar(reveals.noDocumento > 0, `${reveals.noDocumento} elementos de reveal no DOM`, "nenhum elemento de reveal no DOM, a verificação estaria passando no vácuo");
checar(reveals.total >= 10, `${reveals.total} reveals inspecionados em 4 dobras ao voltar`, `só ${reveals.total} reveals inspecionados, amostra pequena demais para valer como verificação`);
checar(reveals.invisiveis.length === 0, "nenhum reveal travado invisível após o scroll", `${reveals.invisiveis.length} elemento(s) invisíveis`, reveals.invisiveis.slice(0, 6).join(", "));

/* O reveal tem de REPETIR: some ao sair da tela e anima de novo ao voltar.
   Sem esta verificação, um `once: true` reintroduzido em qualquer componente
   passaria despercebido, a página continuaria bonita na primeira passada e
   morta em todas as outras. #processo fica de fora: lá quem manda é o
   useScroll da seção travada, e a opacidade é função da posição, não do tempo. */
const repete = await pg.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const alvo = [...document.querySelectorAll("[style*='opacity']")]
    .filter((e) => !e.closest('[aria-hidden="true"]') && !e.closest("#processo"))
    .map((e) => ({ e, topo: e.getBoundingClientRect().top + window.scrollY }))
    .find((c) => c.topo > innerHeight * 2 && c.e.getBoundingClientRect().height > 0);
  if (!alvo) return { achou: false };
  const posicao = alvo.topo - innerHeight * 0.5;
  const ler = () => parseFloat(getComputedStyle(alvo.e).opacity);

  window.scrollTo(0, posicao);
  await espera(2200); /* mola + atraso de encadeamento: 1,4s ainda pega 0,8 */
  const dentro = ler();
  window.scrollTo(0, 0);
  await espera(1000);
  const fora = ler();
  window.scrollTo(0, posicao);
  await espera(2200);
  const devolta = ler();
  return { achou: true, dentro, fora, devolta, onde: alvo.e.closest("section")?.id ?? "?" };
});
checar(repete.achou, "reveal de teste encontrado fora da primeira dobra", "nenhum reveal abaixo de duas dobras, a verificação passaria no vácuo");
checar(
  repete.achou && repete.dentro > 0.9 && repete.fora < 0.5 && repete.devolta > 0.9,
  `reveal repete ao voltar (#${repete.onde}: ${repete.dentro?.toFixed(2)} → ${repete.fora?.toFixed(2)} → ${repete.devolta?.toFixed(2)})`,
  `reveal não repete (${repete.dentro?.toFixed(2)} → ${repete.fora?.toFixed(2)} → ${repete.devolta?.toFixed(2)}), voltou algum viewport.once: true?`,
);

await pg.evaluate(() => window.scrollTo(0, 0));
await pg.waitForTimeout(500);
await pg.screenshot({ path: `${SAIDA}/390-hero.png` });
await pg.screenshot({ path: `${SAIDA}/390-inteira.png`, fullPage: true });
checar(erros.length === 0, "console sem erros", `${erros.length} erro(s) no console`, erros.slice(0, 3).join("\n        "));
/* ───────────── travessão ───────────── */
/* Travessão não é pontuação que gente usa no dia a dia, e no papel ainda se
   confunde com o marcador de lista. A regra está no CLAUDE.md; aqui ela vira
   teste, para não depender de alguém lembrar. Varre onde dói: o JSON do seed e
   o texto que a página realmente renderiza. */
/* O padrão vai por escape de código: escrever o caractere aqui seria quebrar a
   própria regra dentro do teste que a defende. */
const TRAVESSAO = /[\u2013\u2014]/;
const seedBruto = await readFile("src/seed/barba-log.json", "utf8");
checar(
  !TRAVESSAO.test(seedBruto),
  "nenhum travessão no conteúdo do seed",
  "o seed tem travessão; use dois-pontos, vírgula, ponto ou parênteses",
);
const travessoes = await pg.evaluate(() =>
  (document.body.innerText || "")
    .split(/\r?\n/)
    .filter((l) => /[\u2013\u2014]/.test(l))
    .slice(0, 3),
);
checar(
  travessoes.length === 0,
  "nenhum travessão no texto da página",
  `${travessoes.length} linha(s) com travessão na tela`,
  travessoes.join(" | "),
);

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
  // Com reduced-motion o motion NÃO escreve estilo inline nenhum, então
  // procurar por `[style*=opacity]` aqui inspecionaria conjunto vazio. O que
  // importa neste modo é o conteúdo de verdade estar visível.
  const candidatos = [...document.querySelectorAll("section p, section li, section h2, section h3, .palavra-clip")]
    .filter((e) => !e.closest('[aria-hidden="true"]'));
  const escondidos = candidatos
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99)
    .map((e) => e.tagName.toLowerCase());
  const comTransform = [...document.querySelectorAll(".linha-tempo, .ponto-fase, .borda-topo, .borda-dir, .borda-base, .borda-esq")];
  const transformados = comTransform
    .filter((e) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(e).transform))
    .map((e) => (e.className || "").toString().split(" ")[0]);
  return { animando: animando.slice(0, 6), escondidos: escondidos.slice(0, 6), transformados: transformados.slice(0, 6), candidatos: candidatos.length, comTransform: comTransform.length };
});
checar(movimento.animando.length === 0, "nada animando", `${movimento.animando.length} elemento(s) ainda com animação`, movimento.animando.join(", "));
checar(movimento.candidatos > 0 && movimento.comTransform > 0, `inspecionando ${movimento.candidatos} reveals e ${movimento.comTransform} transforms`, "seletores vazios, reduced-motion estaria passando no vácuo");
checar(movimento.escondidos.length === 0, "todo conteúdo visível", "conteúdo escondido com reduced-motion", movimento.escondidos.join(", "));
checar(movimento.transformados.length === 0, "nenhum transform residual (filetes e bordas em estado final)", "transform residual com reduced-motion", movimento.transformados.join(", "));

/* A aba do envelope precisa sumir com reduced-motion, parada, ela cobre o topo
   do cartão. O CSS escondia uma classe que o TSX não usava. */
const abaVisivel = await pgRm.evaluate(() => {
  const aba = document.querySelector(".convite-aba-auto");
  return aba ? getComputedStyle(aba).display !== "none" : false;
});
checar(!abaVisivel, "aba do envelope escondida com reduced-motion", "a aba do envelope ficou visível e parada sobre o cartão");

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
  const emBranco = [...document.querySelectorAll("section, [style*='opacity'], .palavra-clip")]
    .filter((e) => !e.closest('[aria-hidden="true"]'))
    .filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === "hidden")
    .map((e) => e.id || (e.className || "").toString().split(" ")[0] || e.tagName.toLowerCase());
  const grudados = [...document.querySelectorAll("*")]
    .filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position))
    .map((e) => e.tagName.toLowerCase() + "." + (e.className || "").toString().split(" ")[0]);
  const cortados = [...document.querySelectorAll(".palavra-clip")]
    .filter((e) => getComputedStyle(e).overflow !== "visible").length;
  const rodape = document.querySelector(".print-only");
  const comVidro = [...document.querySelectorAll("*")].filter((e) => {
    const s = getComputedStyle(e);
    return (s.backdropFilter && s.backdropFilter !== "none") ||
           (s.webkitBackdropFilter && s.webkitBackdropFilter !== "none");
  }).length;
  return {
    comVidro,
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
checar(impressao.comVidro === 0, "nenhum backdrop-filter sobrevive à impressão", `${impressao.comVidro} elemento(s) com vidro no papel, vira borrão cinza sobre o texto`);
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

/* ───────────── 4. o PDF gerado no servidor ───────────── */
console.log("\n▸ PDF por biblioteca");
// Contexto proprio: os contextos de navegador anteriores ja foram fechados.
const api = await request.newContext();
const respostaPdf = await api.get(`${BASE}${CAMINHO}/pdf`);
const corpoPdf = await respostaPdf.body();
checar(respostaPdf.status() === 200, "rota /pdf responde", `rota /pdf devolveu ${respostaPdf.status()}`);
checar(respostaPdf.headers()["content-type"] === "application/pdf", "content-type é application/pdf", `content-type inesperado: ${respostaPdf.headers()["content-type"]}`);
checar(corpoPdf.subarray(0, 4).toString() === "%PDF", "arquivo é um PDF válido", "o corpo não começa com %PDF");
/* A logo entra por Buffer. Com caminho de arquivo o react-pdf tenta buscar por
   `fetch`, falha em SILÊNCIO e devolve um PDF válido SEM a imagem, defeito que
   só o peso denuncia. */
checar(corpoPdf.length > 100_000, `logo embutida (${Math.round(corpoPdf.length / 1024)} KB)`, `PDF com apenas ${Math.round(corpoPdf.length / 1024)} KB, a logo provavelmente não foi embutida`);
const paginas = corpoPdf.toString("latin1").split("/Type /Page").length - 1;
checar(paginas >= 6, `${paginas - 1} páginas`, `só ${paginas - 1} páginas, o documento parece truncado`);

const pdfSemToken = await api.get(`${BASE}/barba-log-0000000000/pdf`);
checar(pdfSemToken.status() === 404, "token errado no PDF dá 404", `token errado devolveu ${pdfSemToken.status()}`);

/* ───────────── admin fechado ─────────────
   A proposta é pública por posse do token; o painel não é público de jeito
   nenhum. Estas três verificações cobrem as três formas de errar isso: rota
   aberta, cookie forjado aceito, e tela de entrada quebrada. */
console.log("\n▸ admin fechado");

const admSemCookie = await api.get(`${BASE}/painel/nova`, { maxRedirects: 0 });
checar(
  [307, 302, 303].includes(admSemCookie.status()),
  `/painel sem sessão redireciona (${admSemCookie.status()})`,
  `/painel sem sessão devolveu ${admSemCookie.status()}, deveria redirecionar`,
);

/* Cookie inventado passa pelo proxy (que só olha se existe) e precisa morrer no
   `exigirAdmin()`, que confere a assinatura. É o teste que prova que o proxy não
   é a autorização. */
const apiForjada = await request.newContext({
  extraHTTPHeaders: { cookie: "sessao_admin=99999999999999.assinaturafalsa" },
});
const admForjado = await apiForjada.get(`${BASE}/painel/nova`, { maxRedirects: 0 });
checar(
  [307, 302, 303].includes(admForjado.status()),
  "cookie forjado é recusado pela assinatura",
  `cookie forjado devolveu ${admForjado.status()}: o HMAC não está sendo conferido`,
);
await apiForjada.dispose();

const entrada = await api.get(`${BASE}/painel`);
const htmlEntrada = await entrada.text();
checar(
  entrada.status() === 200 && htmlEntrada.includes('type="password"'),
  "tela de entrada responde com campo de senha",
  `tela de entrada devolveu ${entrada.status()} sem campo de senha`,
);

await api.dispose();

/* ───────────── 5. foco de teclado ───────────── */
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
  return {
    elemento: e.tagName.toLowerCase(),
    outline: s.outlineWidth,
    cor: s.outlineColor,
    estilo: s.outlineStyle,
    // Um anel da mesma cor do texto é `currentColor`, o valor inicial de
    // `outline-color`. Significa que a cor do foco não chegou (ou está
    // transicionando), e sobre um botão colorido isso é um anel invisível.
    corDoTexto: s.color,
  };
});
checar(
  !!foco && foco.cor !== foco.corDoTexto,
  foco ? `anel de foco com cor própria (${foco.cor})` : "anel de foco com cor própria",
  "o anel de foco está em currentColor, invisível sobre fundo colorido",
  JSON.stringify(foco),
);
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
    ? `\n✓ tudo passou, screenshots e PDF em ${SAIDA}/\n`
    : `\n✗ ${falhas} verificação(ões) falharam\n`,
);
process.exit(falhas === 0 ? 0 : 1);
