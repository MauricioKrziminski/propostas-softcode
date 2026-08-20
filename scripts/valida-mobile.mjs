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

/* ───────── a cortina entre capítulos ─────────

   O capítulo seguinte sobe POR CIMA do anterior, que fica parado embaixo. Três
   perguntas, e as três já quebraram nas tentativas de fazer isto em CSS puro:
   o anterior congela mesmo? sobra buraco em alguma altura da página? e o piso
   de uma tela por capítulo continua de pé?

   `behavior: "instant"` não é detalhe: com o `scroll-behavior: smooth` do
   projeto a medição lê uma posição que o navegador ainda não alcançou, e o
   teste passa no vácuo. */
const cortina = await pg.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const vh = innerHeight;

  window.scrollTo({ top: 0, behavior: "instant" });
  await espera(200);
  /* O rodapé é FIXO e cobre a faixa de baixo, então a linha de congelamento não
     é o rodapé da JANELA e sim o topo do rodapé. Cravando na janela, a última
     fatia de cada capítulo ficaria escondida atrás dele. */
  const alturaRodape = Math.round(document.querySelector("footer").getBoundingClientRect().height);
  const linha = vh - alturaRodape;
  const blocos = [...document.querySelectorAll("main > div")];
  /* Medidos com a página no topo: nenhum bloco está deslocado aqui. */
  const fins = blocos.map((b) => b.getBoundingClientRect().bottom + scrollY);
  const baixos = blocos
    .filter((b) => b.getBoundingClientRect().height < vh - 1)
    .map((b) => b.querySelector("section")?.id ?? "?");

  /* 1. congelamento: a base do bloco fica cravada no fim da tela enquanto o
        seguinte sobe. */
  const alvo = blocos[1];
  const seguinte = blocos[2];
  const medidas = [];
  for (const d of [0, 200, 400]) {
    window.scrollTo({ top: fins[1] - linha + d, behavior: "instant" });
    await espera(140);
    medidas.push({
      d,
      base: Math.round(alvo.getBoundingClientRect().bottom),
      topoSeguinte: Math.round(seguinte.getBoundingClientRect().top),
    });
  }

  /* 2. nenhum buraco: em toda a altura da página, os três pontos da tela
        pertencem sempre a um capítulo, ao hero ou ao rodapé. */
  const alt = document.documentElement.scrollHeight;
  const buracos = [];
  const dono = (y) => {
    const e = document.elementFromPoint(Math.round(innerWidth / 2), y);
    if (!e) return "NADA";
    if (e.closest(".cabecalho-fixo")) return "cabecalho";
    if (e.closest("main > div")) return "capitulo";
    if (e.closest("footer")) return "rodape";
    if (e.closest("header")) return "hero";
    return `BURACO:${e.tagName.toLowerCase()}`;
  };
  for (let y = 0; y <= alt - vh; y += 120) {
    window.scrollTo({ top: y, behavior: "instant" });
    await espera(16);
    const pts = [dono(70), dono(Math.round(linha / 2)), dono(linha - 3)];
    if (pts.some((p) => p.startsWith("BURACO") || p === "NADA")) buracos.push(`${y}: ${pts.join(" | ")}`);
  }
  /* 3. as PONTAS da folha que sobe. A aresta estufa no meio, então nas pontas
        ela desce e mostra o que está atrás: precisa ser o capítulo anterior, e
        nunca o branco do body. Medido a 6px da quina, que é dentro do raio. */
  const subindo = blocos[2];
  window.scrollTo({ top: fins[1] - linha + 240, behavior: "instant" });
  await espera(200);
  const r = subindo.getBoundingClientRect();
  const quinas = [6, innerWidth - 6].map((x) => {
    const e = document.elementFromPoint(x, Math.round(r.top) + 6);
    return e?.closest("main > div") || e?.closest("header") ? "capitulo" : `NU:${e?.tagName}`;
  });
  /* O raio de cima é ELÍPTICO: 50% na horizontal (as duas metades se encontram
     no centro e viram UM arco) e a barriga na vertical. O que interessa medir é
     a barriga, que é o segundo número. */
  const cantoCima = getComputedStyle(subindo).borderTopLeftRadius;
  const raio = parseFloat(cantoCima.split(" ")[1] ?? "0");
  const arcoInteiro = cantoCima.includes("50%");

  window.scrollTo({ top: 0, behavior: "instant" });
  return { vh, linha, alturaRodape, baixos, medidas, buracos: buracos.slice(0, 5), pontos: Math.ceil((alt - vh) / 120) * 3, quinas, raio, arcoInteiro };
});
checar(
  cortina.baixos.length === 0,
  "todo capítulo tem ao menos uma tela de altura (piso de 100dvh)",
  `${cortina.baixos.length} capítulo(s) mais baixos que a tela: aparece faixa do capítulo anterior por cima da cortina`,
  cortina.baixos.join(", "),
);
checar(
  cortina.medidas.every((m) => Math.abs(m.base - cortina.linha) <= 2),
  `o capítulo anterior CONGELA no topo do rodapé fixo (base em ${cortina.medidas.map((m) => m.base).join(", ")}, linha em ${cortina.linha})`,
  "o capítulo anterior continua subindo, ou congelou atrás do rodapé fixo",
  JSON.stringify(cortina.medidas),
);
checar(
  cortina.medidas.every((m) => Math.abs(m.topoSeguinte - (cortina.linha - m.d)) <= 3),
  "e o capítulo seguinte sobe por cima dele, na medida do dedo",
  "o capítulo seguinte não acompanha o scroll durante a cortina",
  JSON.stringify(cortina.medidas),
);
checar(
  cortina.raio > 6,
  `a folha sobe com a aresta ESTUFADA (${Math.round(cortina.raio)}px de barriga no meio da subida)`,
  "a aresta subiu reta: o olho lê um wipe, não uma folha de líquido passando por cima da outra",
);
checar(
  cortina.arcoInteiro,
  "e a curva atravessa a linha INTEIRA (raio horizontal de 50%)",
  "o raio horizontal deixou de ser 50%: viram dois cantinhos redondos e o meio da aresta volta a ser reto",
);
checar(
  cortina.quinas.every((q) => q === "capitulo"),
  "e atrás da barriga do arco está o capítulo anterior, não o fundo do body",
  "a barriga do arco mostrando fundo do body: falta piso de uma tela no capítulo de baixo",
  cortina.quinas.join(", "),
);
/* O rodapé é o único bloco que a cortina deixou POSICIONADO sem ser capítulo, e
   por isso ele pinta por cima do último capítulo congelado. Transparente, o
   escuro congelado aparecia atrás dele e todo o texto de tema claro do rodapé
   sumia. Precisa ser opaco E de largura inteira: com o fundo só na faixa de
   leitura, sobram duas tiras escuras nas laterais. */
const rodape = await pg.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const f = document.querySelector("footer");
  const max = document.documentElement.scrollHeight - innerHeight;
  /* O rodapé é FIXO: ele ocupa a faixa de baixo da janela o tempo todo e não se
     mexe em nenhum scroll. Se o topo dele andar, ou ele voltou a ser cortina, ou
     algum ancestral voltou a reter `transform` e quebrou o `position: fixed`. */
  const topos = [];
  for (const y of [0, Math.round(max / 2), max]) {
    window.scrollTo({ top: y, behavior: "instant" });
    await espera(260);
    topos.push(Math.round(f.getBoundingClientRect().top));
  }
  const r = f.getBoundingClientRect();
  const cor = getComputedStyle(f).backgroundColor;
  const alfa = cor.startsWith("rgba") ? parseFloat(cor.split(",")[3]) : 1;
  const pontos = [8, Math.round(innerWidth / 2), innerWidth - 8].map(
    (x) => !!document.elementFromPoint(x, Math.round(r.top + 30))?.closest("footer"),
  );
  window.scrollTo({ top: 0, behavior: "instant" });
  return {
    opaco: cor !== "rgba(0, 0, 0, 0)" && alfa > 0.99,
    cor,
    cobreTudo: pontos.every(Boolean),
    topos,
    parado: Math.max(...topos) - Math.min(...topos) <= 3,
  };
});
/* O cabeçalho fixo tinha o MESMO defeito e ninguém guardava: `.proposta-entrando`
   retinha `transform: matrix(1,0,0,1,0,0)` do `fill: both`, e ancestral com
   transform, mesmo a identidade, vira bloco contêiner de todo `position: fixed`
   descendente. No scroll 6000 o topo do cabeçalho estava em -6000. */
const cabecalho = await pg.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const c = document.querySelector(".cabecalho-fixo");
  const topos = [];
  for (const y of [0, 1500, 6000]) {
    window.scrollTo({ top: y, behavior: "instant" });
    await espera(200);
    topos.push(Math.round(c.getBoundingClientRect().top));
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  return { topos, fixo: new Set(topos).size === 1 };
});
checar(
  cabecalho.fixo,
  `o cabeçalho é FIXO de verdade (topo em ${cabecalho.topos.join(", ")})`,
  "o cabeçalho rolou junto com a página: algum ancestral está retendo transform",
  cabecalho.topos.join(", "),
);

checar(rodape.opaco, "o rodapé tem fundo opaco", `rodapé transparente (${rodape.cor}): o capítulo escuro congelado aparece atrás e o texto some`);
checar(rodape.cobreTudo, "e o fundo dele vai de ponta a ponta", "sobram tiras do capítulo escuro nas laterais do rodapé");
checar(
  rodape.parado,
  `o rodapé é FIXO e não se mexe (topo em ${rodape.topos.join(", ")})`,
  "o rodapé andou com o scroll: virou cortina, ou um ancestral com transform quebrou o position: fixed",
  rodape.topos.join(", "),
);

checar(
  cortina.buracos.length === 0,
  `nenhum buraco na cortina (${cortina.pontos} pontos medidos de ponta a ponta)`,
  `${cortina.buracos.length} altura(s) com fundo aparecendo entre capítulos`,
  cortina.buracos.join("\n        "),
);

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
  /* Medir do TOPO, e não de onde a varredura anterior parou: `getBoundingClientRect`
     inclui o transform da cortina, e no meio da página o capítulo que está
     congelado devolve uma posição até uma tela abaixo da real. Com a página no
     topo todo capítulo está em progresso 0, ou seja, sem transform nenhum, e aí
     `top + scrollY` volta a ser o offset de layout.

     `behavior: "instant"` é obrigatório: a página rola SUAVE, e vindo de 4800px
     o navegador ainda estaria no meio do caminho depois da espera. A medição
     saía de um ponto que nunca existiu e o alvo ia parar fora da tela. */
  window.scrollTo({ top: 0, behavior: "instant" });
  await espera(300);
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

/* A cortina é `useScroll`, então ela some por inteiro com reduced-motion: o `y`
   nunca chega ao `style` e o transform computado fica `none`. O piso de uma
   tela fica, mas isso é só espaço em branco a mais, com tudo visível. */
const cortinaParada = await pgRm.evaluate(async () => {
  window.scrollTo({ top: innerHeight * 3, behavior: "instant" });
  await new Promise((r) => setTimeout(r, 300));
  const fora = [...document.querySelectorAll("main > div")]
    .filter((d) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(d).transform))
    .map((d) => d.querySelector("section")?.id ?? "?");
  window.scrollTo({ top: 0, behavior: "instant" });
  return fora;
});
checar(
  cortinaParada.length === 0,
  "cortina desligada com reduced-motion",
  `${cortinaParada.length} capítulo(s) ainda deslocados`,
  cortinaParada.join(", "),
);

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

/* A capa do convite com reduced-motion: nome inteiro visível e a camada de luz
   apagada. Parada, a luz é uma faixa metálica cobrindo metade do nome.

   A medição é numa aba PRÓPRIA, que não dispensa o convite: a checagem antiga
   olhava a página já com o convite fora do DOM, então `querySelector` devolvia
   `null` e ela passava no vácuo, sempre. */
const ctxCapa = await navegador.newContext({ ...iPhone, reducedMotion: "reduce" });
const pgCapa = await ctxCapa.newPage();
await pgCapa.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await pgCapa.waitForTimeout(600);
const capa = await pgCapa.evaluate(() => {
  const luz = document.querySelector(".convite-foil");
  const onda = document.querySelector(".convite-onda");
  const lacre = document.querySelector(".convite-lacre");
  /* O nome é datilografado, então a unidade é a LETRA. O seletor antigo
     (`.convite-caixa > span`) não existe mais: deixado como estava, ele
     devolveria lista vazia e a checagem passaria no vácuo. */
  const letras = [...document.querySelectorAll("#convite [data-nome] .convite-tecla")];
  const cursores = [
    document.querySelector("#convite .convite-cursor"),
    ...[...document.querySelectorAll("#convite .convite-tecla")].slice(0, 1),
  ];
  const parado = (e) =>
    ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(e).transform);
  return {
    achouLuz: Boolean(luz),
    luzApagada: luz ? parseFloat(getComputedStyle(luz).opacity) === 0 : false,
    achouLacre: Boolean(lacre && onda),
    /* A aba parada no meio do giro é um triângulo flutuando fora do envelope. */
    abaFechada: (() => {
      const a = document.querySelector(".convite-aba");
      if (!a) return false;
      const t = getComputedStyle(a).transform;
      /* `translateZ(3px)` é o repouso: matriz 3D sem rotação nenhuma. */
      return !t.includes("matrix3d") || /matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0/.test(t);
    })(),
    /* A onda do carimbo parada é um anel azul desenhado em volta do lacre, e o
       lacre parado no meio da prensa é um selo gigante estourando o cartão. */
    ondaApagada: onda ? parseFloat(getComputedStyle(onda).opacity) === 0 : false,
    lacreAssentado: lacre ? parado(lacre) : false,
    letras: letras.length,
    escondidas: letras.filter((e) => {
      const s = getComputedStyle(e);
      return parseFloat(s.opacity) < 0.99 || !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(s.transform);
    }).length,
    /* Cursor parado e aceso é um risco azul cravado no meio do nome do cliente:
       a mesma classe de defeito da onda do carimbo. */
    cursorApagado:
      parseFloat(getComputedStyle(cursores[0]).opacity) === 0 &&
      parseFloat(getComputedStyle(cursores[1], "::after").opacity) === 0,
    /* As faixas PARAM com reduced-motion, mas continuam visíveis: elas são
       fundo impresso, não movimento. */
    faixasVisiveis: [".convite-faixa-alta", ".convite-faixa-baixa"].every(
      (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).opacity) > 0,
    ),
    /* Um `--font-convite` não mapeado degrada para Georgia sem nada acusar. */
    nomeEmBodoni: /bodoni/i.test(getComputedStyle(document.querySelector(".convite-nome")).fontFamily),
    animando: [...document.querySelectorAll("#convite *")].filter(
      (e) => getComputedStyle(e).animationName !== "none",
    ).length,
    botao: Boolean(document.querySelector("#convite button")),
  };
});
checar(capa.achouLuz, "a camada de luz existe no DOM", "seletor .convite-foil vazio, a checagem passaria no vácuo");
checar(capa.luzApagada, "luz do nome apagada com reduced-motion", "a luz ficou parada cobrindo o nome");
checar(capa.achouLacre, "o lacre e a onda existem no DOM", "seletores do lacre vazios, a checagem passaria no vácuo");
checar(capa.ondaApagada, "onda do carimbo apagada com reduced-motion", "a onda ficou parada como anel azul em volta do lacre");
checar(capa.lacreAssentado, "lacre assentado com reduced-motion", "o lacre ficou parado no meio da prensa, em escala grande");
checar(capa.abaFechada, "aba do envelope fechada com reduced-motion", "a aba ficou parada no meio do giro, flutuando fora do envelope");
checar(capa.letras > 0 && capa.escondidas === 0, `nome inteiro visível (${capa.letras} letra(s))`, "letra do nome escondida com reduced-motion");
checar(capa.cursorApagado, "cursor da datilografia apagado com reduced-motion", "o cursor ficou parado e aceso, como um risco azul dentro do nome");
checar(capa.faixasVisiveis, "as faixas continuam visíveis com reduced-motion", "as faixas sumiram: elas são fundo impresso, não movimento");
checar(capa.nomeEmBodoni, "o nome do cliente sai na face do convite (Bodoni)", "o nome caiu no fallback: --font-convite não chegou ao elemento");
checar(capa.animando === 0, "nada animando na capa", `${capa.animando} elemento(s) da capa ainda animam`);
checar(capa.botao, "a capa tem botão para dispensar", "sem <button> dentro de #convite: o convite viraria beco sem saída");

/* Duas colisões de composição que só apareceram com nome de cliente de duas
   linhas, e que voltam calado se alguém mexer nas constantes de espaçamento:
     · o lacre mora no vértice da aba e desce sobre a etiqueta;
     · o recorte de linha (`overflow: hidden`) fica MENOR que o texto e come
       metade do escopo. Foi o `align-self: stretch` de item de grid: a altura
       vinha da trilha, não do conteúdo. */
const composicao = await pgCapa.evaluate(() => {
  const cx = (s) => document.querySelector(s)?.getBoundingClientRect();
  const lacre = cx(".convite-lacre-area");
  const etiqueta = cx(".convite-etiqueta");
  const frente = cx(".convite-frente");
  const endereco = cx(".convite-endereco");
  const cortadas = [...document.querySelectorAll("#convite .linha-clip")].filter((e) => {
    const dentro = e.firstElementChild?.getBoundingClientRect();
    return dentro && Math.round(dentro.height) > Math.round(e.getBoundingClientRect().height) + 1;
  }).length;
  return {
    achou: Boolean(lacre && etiqueta && frente && endereco),
    lacreLivre: lacre.bottom <= etiqueta.top + 1,
    recortes: document.querySelectorAll("#convite .linha-clip").length,
    cortadas,
    enderecoDentro: endereco.top >= frente.top && endereco.bottom <= frente.bottom,
  };
});
checar(composicao.achou, "as peças da composição existem no DOM", "seletores da composição vazios, a checagem passaria no vácuo");
checar(composicao.lacreLivre, "o lacre não encosta na etiqueta", "o lacre desceu sobre o texto do endereçamento");
checar(
  composicao.recortes > 0 && composicao.cortadas === 0,
  `${composicao.recortes} recorte(s) de linha, nenhum cortando o texto`,
  `${composicao.cortadas} linha(s) com o texto maior que o próprio recorte: metade da frase some`,
);
checar(composicao.enderecoDentro, "o endereçamento cabe dentro do envelope", "o endereçamento transbordou o envelope");

/* O caso que quebra é NOME LONGO, e a proposta semeada tem nome curto: com uma
   linha só o bloco centralizado nunca chega perto do lacre, e a checagem acima
   passa mesmo com a geometria errada. Em vez de semear outra proposta só para
   isto, o nome é trocado no DOM e a composição é medida de novo. */
const comNomeLongo = await pgCapa.evaluate(() => {
  const palavras = [...document.querySelectorAll("#convite [data-nome]")];
  /* Cada palavra é uma caixa `nowrap`. Sem soltar isso, a frase inteira vira UMA
     linha, o nome estoura o envelope, e o próprio portão `linhas >= 2` acusa que
     a checagem parou de exercitar o caso que aperta. */
  palavras[0].style.whiteSpace = "normal";
  palavras[0].textContent = "Transportadora Almeida e Filhos Logística";
  palavras.slice(1).forEach((e) => e.remove());
  document.querySelector("#convite .convite-cursor")?.remove();
  const cx = (s) => document.querySelector(s).getBoundingClientRect();
  const lacre = cx(".convite-lacre-area");
  const etiqueta = cx(".convite-etiqueta");
  const rodape = cx(".convite-canto-esq");
  const endereco = cx(".convite-endereco");
  const nome = cx("#convite h1");
  /* A ÚLTIMA LINHA, e não a caixa. O bloco é `flex-start`, então com nome longo
     o conteúdo transborda a caixa: medir a caixa deixava passar texto de verdade
     caindo em cima do rodapé. */
  const ultima = document.querySelector(".convite-endereco").lastElementChild.getBoundingClientRect();
  return {
    linhas: Math.round(nome.height / parseFloat(getComputedStyle(document.querySelector(".convite-nome")).lineHeight)),
    lacreLivre: lacre.bottom <= etiqueta.top + 1,
    rodapeLivre: ultima.bottom <= rodape.top + 1,
    caixa: Math.round(endereco.height),
  };
});
checar(
  comNomeLongo.linhas >= 2,
  `nome longo ocupa ${comNomeLongo.linhas} linhas (é o caso que aperta)`,
  "o nome de teste não quebrou em várias linhas: a checagem não está exercitando nada",
);
checar(comNomeLongo.lacreLivre, "com nome longo o lacre continua livre", "com nome de duas linhas o endereçamento sobe e encosta no lacre");
checar(comNomeLongo.rodapeLivre, "com nome longo o rodapé continua livre", "com nome de duas linhas o endereçamento desce sobre o rodapé");
await pgCapa.screenshot({ path: `${SAIDA}/390-convite-reduced-motion.png` });
await ctxCapa.close();

/* E o convite COM movimento: foto do estado final e a prova da ABERTURA.

   Duas coisas são verificadas aqui, e as duas já quebraram:

   1. a SOBREPOSIÇÃO. A passagem convite → proposta existe em três fases
      justamente para as duas telas conviverem por um instante. Com duas fases,
      a proposta só começava a entrar depois de o convite sair inteiro, e
      sobrava um quadro de tela vazia no meio.

   2. a COBERTURA. A carta precisa tomar a viewport ANTES de a camada começar a
      se apagar. Sem isso, o papel fica translúcido no meio do caminho, a aresta
      de baixo dele corta a tela na horizontal, e "entrar na carta" vira "painel
      cinza passando".

   Os nomes das animações estão escritos à mão aqui, então eles PRECISAM
   acompanhar `globals.css`. Já ficaram defasados uma vez: o congelamento não
   pegava animação nenhuma, a medição lia o estado ao vivo e a checagem passava
   no vácuo. A asserção de cobertura existe também para isso: ela é falsa se o
   congelamento não estiver funcionando. */
const ANIMACOES_DA_ABERTURA = [
  "convite-romper",
  "convite-abrir-aba",
  "convite-forro-abrindo",
  "convite-tirar-carta",
  "convite-entrar-na-carta",
  "convite-sumir",
  "proposta-entrar",
];
const ctxConvite = await navegador.newContext({ ...iPhone });
const pgConvite = await ctxConvite.newPage();
await pgConvite.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
/* 3600ms: a cena vai até 3400ms (a luz de foil fecha em 2500 + 900). Esperar os
   2400ms de antes fotografava a peça no meio da montagem. */
await pgConvite.waitForTimeout(3600);
await pgConvite.screenshot({ path: `${SAIDA}/390-convite.png` });

/* O envelope precisa CHEGAR ABERTO e se fechar: é a animação da peça em si, e
   ela é fácil de perder num refactor (basta a regra da aba sumir que o
   envelope passa a aparecer pronto, sem nada acusar). Medido cedo, ao vivo:
   congelar não serve, porque animação com `fill: backwards` já soltou o
   elemento quando a cena termina, e reposicionar o relógio não a traz de
   volta. Foi assim que uma medição errada quase me convenceu de que a aba não
   estava animando. */
const ctxAba = await navegador.newContext({ ...iPhone });
const pgAba = await ctxAba.newPage();
await pgAba.goto(BASE + CAMINHO, { waitUntil: "domcontentloaded" });
await pgAba.waitForTimeout(300);
const grausDaAba = async (pagina) =>
  pagina.evaluate(() => {
    const t = getComputedStyle(document.querySelector(".convite-aba")).transform;
    const m = t.match(/matrix3d\(1, 0, 0, 0, 0, ([-\d.]+), ([-\d.]+)/);
    return m ? Math.round((Math.atan2(+m[2], +m[1]) * 180) / Math.PI) : 0;
  });
const abaNoComeco = await grausDaAba(pgAba);
/* A aba fecha de 900ms a 1660ms. 300 + 2000 lê em 2300ms, com folga. */
await pgAba.waitForTimeout(2000);
const abaNoFim = await grausDaAba(pgAba);
checar(
  abaNoComeco < -90,
  `o envelope chega ABERTO e se fecha (${abaNoComeco}° para ${abaNoFim}°)`,
  `a aba começou em ${abaNoComeco}°: o envelope aparece pronto, sem se montar`,
);
checar(Math.abs(abaNoFim) <= 2, "e a aba assenta fechada", `a aba parou em ${abaNoFim}°`);
await ctxAba.close();

/* ───────── as camadas de AMBIENTE do convite ─────────

   Aurora, faixas e a brasa do botão são camada 0, 1 e 3: elas não pedem
   atenção, e é justamente por isso que morrem num refactor sem ninguém ver. As
   quatro checagens abaixo existem porque nenhuma delas falharia sozinha. */
const ambiente = await pgConvite.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const m41 = (sel) => {
    const t = getComputedStyle(document.querySelector(sel)).transform;
    const m = t.match(/^matrix\([-\d.e+]+, [-\d.e+]+, [-\d.e+]+, [-\d.e+]+, (-?[\d.e+]+)/);
    return m ? Number(m[1]) : 0;
  };
  const antesA = m41(".convite-faixa-alta .convite-faixa-pista");
  const antesB = m41(".convite-faixa-baixa .convite-faixa-pista");
  await espera(400);
  const foco = document.querySelector(".convite-foco");
  const doc = document.documentElement;
  return {
    deltaA: m41(".convite-faixa-alta .convite-faixa-pista") - antesA,
    deltaB: m41(".convite-faixa-baixa .convite-faixa-pista") - antesB,
    auroraA: getComputedStyle(foco, "::before").animationName,
    auroraB: getComputedStyle(foco, "::after").animationName,
    brasa: getComputedStyle(document.querySelector(".convite-acao"), "::before").animationName,
    /* A pista da faixa é `max-content`, ou seja, muito mais larga que a tela. A
       checagem de overflow lá em cima roda DEPOIS de dispensar o convite, então
       ela nunca olhou para esta tela. É a falha clássica de marquee. */
    estoura: doc.scrollWidth > doc.clientWidth + 1,
    largura: doc.scrollWidth,
  };
});
checar(
  ambiente.deltaA * ambiente.deltaB < 0,
  `as faixas correm em sentidos opostos (${ambiente.deltaA.toFixed(1)} e ${ambiente.deltaB.toFixed(1)})`,
  "as faixas andam para o mesmo lado, ou pararam: a contra-esteira é a profundidade da cena",
);
checar(
  ambiente.auroraA === "convite-aurora-a" && ambiente.auroraB === "convite-aurora-b",
  "a aurora da mesa está andando nas duas manchas",
  "a aurora parou: a mesa volta a ser um retângulo preto e a silhueta perde o recorte contínuo",
  `${ambiente.auroraA} / ${ambiente.auroraB}`,
);
checar(ambiente.brasa === "convite-brasa", "a brasa do botão respira", "a brasa do CTA parou");
checar(!ambiente.estoura, "a capa não rola de lado", `a faixa estourou a tela (${ambiente.largura}px)`);

/* E também não pode rolar PARA BAIXO quando o convite cabe na tela.
   `#convite` é `overflow-y: auto` de propósito (em tela baixa o botão precisa
   continuar alcançável), e por isso qualquer filho absoluto que passe da borda
   de baixo vira área rolável: com o `inset` negativo da mesa sobrava uma faixa
   vazia de uns 200px abaixo do botão, e quem rolava achava que existia mais uma
   seção ali. */
const rolagemDaCapa = await pgConvite.evaluate(() => {
  const c = document.querySelector("#convite");
  return { sobra: c.scrollHeight - c.clientHeight, cabe: c.clientHeight > 560 };
});
checar(
  !rolagemDaCapa.cabe || rolagemDaCapa.sobra <= 1,
  "o convite não tem nada rolável abaixo do botão",
  `sobram ${rolagemDaCapa.sobra}px de rolagem no convite: parece que existe outra seção embaixo`,
);

/* ───────── o orçamento de propriedades animadas ─────────

   Só `transform` e `opacity` animam nesta tela, mais duas exceções nomeadas:
   `--brilho` (o ângulo interpolável do anel de metal) e `font-variation-settings`
   no monograma do lacre, que é a emenda documentada no CLAUDE.md. Qualquer
   terceira propriedade animada aqui é defeito de custo, não de gosto, e até hoje
   nada guardava essa regra. */
const propriedades = await pgConvite.evaluate(() => {
  const permitido = new Set(["transform", "opacity", "--brilho"]);
  const fora = [];
  for (const a of document.getAnimations()) {
    const alvo = a.effect?.target;
    if (!alvo || !alvo.closest?.("#convite")) continue;
    for (const q of a.effect.getKeyframes()) {
      for (const prop of Object.keys(q)) {
        if (["offset", "computedOffset", "easing", "composite"].includes(prop)) continue;
        if (permitido.has(prop)) continue;
        if (prop === "fontVariationSettings" && alvo.classList.contains("convite-lacre-marca")) continue;
        fora.push(`${(alvo.className || "").toString().split(" ")[0] || alvo.tagName}:${prop}`);
      }
    }
  }
  return [...new Set(fora)];
});
checar(
  propriedades.length === 0,
  "só transform e opacity animam no convite (mais as duas exceções nomeadas)",
  `${propriedades.length} propriedade(s) fora do orçamento`,
  propriedades.join(", "),
);

/* ───────── contraste da tinta sobre o papel ─────────

   O papel virou CLARO e a tinta virou escura: é a inversão inteira da peça. "O
   nome do cliente ficou invisível" já aconteceu neste arquivo uma vez, com as
   cores no sentido contrário, e nada no validador teria pego. */
const contraste = await pgConvite.evaluate(() => {
  const canal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (cor) => {
    const [r, g, b] = cor.match(/[\d.]+/g).map(Number);
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  /* O papel é um GRADIENTE, então `backgroundColor` da frente vem
     `rgba(0, 0, 0, 0)` e a conta daria contraste contra preto: a primeira
     versão desta checagem reprovou a peça inteira medindo tinta escura contra
     um fundo que não existe. A cor de referência é o token do papel. */
  const hex = getComputedStyle(document.querySelector("#convite")).getPropertyValue("--papel").trim();
  const fundo = lum(
    `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`,
  );
  return [".convite-nome", ".convite-etiqueta", ".convite-canto-esq", ".convite-linha"].map((sel) => {
    const l = lum(getComputedStyle(document.querySelector(sel)).color);
    const [a, b] = l > fundo ? [l, fundo] : [fundo, l];
    return { sel, razao: Number(((a + 0.05) / (b + 0.05)).toFixed(2)) };
  });
});
const fracos = contraste.filter((c) => c.razao < 4.5);
checar(
  fracos.length === 0,
  `tinta legível sobre o papel (${contraste.map((c) => c.razao).join(", ")}:1)`,
  `${fracos.length} texto(s) abaixo de 4.5:1 no envelope`,
  fracos.map((c) => `${c.sel} ${c.razao}:1`).join(", "),
);

await pgConvite.locator("#convite button").click({ noWaitAfter: true });
/** Congela a abertura num instante exato e mede o que está em cena. */
async function abrirEmCamaLenta(instante) {
  const congelou = await pgConvite.evaluate(
    ([ms, nomes]) => {
      let n = 0;
      for (const a of document.getAnimations()) {
        if (nomes.includes(a.animationName || "")) {
          a.pause();
          a.currentTime = ms;
          n++;
        }
      }
      const capa = document.querySelector("#convite");
      const proposta = document.querySelector(".proposta-entrando");
      const carta = document.querySelector(".convite-carta");
      const visivel = (e) => (e ? parseFloat(getComputedStyle(e).opacity) : 0);
      const r = carta?.getBoundingClientRect();
      /* A aba é pintada NA FRENTE da carta (`translateZ` maior), então cobrir a
         viewport com a carta não basta: se a aba ainda estiver opaca, sobra uma
         faixa navy no alto. Já aconteceu. */
      const aba = document.querySelector(".convite-aba-forro");
      const abaFora = document.querySelector(".convite-aba-fora");
      return {
        congeladas: n,
        capa: visivel(capa),
        proposta: visivel(proposta),
        cartaCobre: Boolean(r) && r.top <= 0 && r.bottom >= window.innerHeight,
        envelopeApagado: visivel(aba) < 0.05 && visivel(abaFora) < 0.05,
      };
    },
    [instante, ANIMACOES_DA_ABERTURA],
  );
  return congelou;
}

/* 820ms: o instante em que a carta acabou de tomar a tela e a camada ainda não
   começou a se apagar. É o quadro que define se a passagem funciona. */
const cobertura = await abrirEmCamaLenta(820);
checar(
  cobertura.congeladas >= 4,
  `${cobertura.congeladas} animações da abertura congeladas`,
  "nenhuma animação da abertura foi encontrada: os nomes em ANIMACOES_DA_ABERTURA saíram de sincronia com globals.css",
);
checar(
  cobertura.cartaCobre,
  "a carta cobre a tela antes de a camada se apagar",
  "sobra fundo em volta da carta no quadro da dissolução: a passagem vira painel translúcido",
);
checar(
  cobertura.envelopeApagado,
  "o envelope já saiu de cena quando a carta cobre",
  "a aba continua pintada na frente da carta: sobra uma faixa navy no alto da tela",
);

/* 900ms: já dentro da dissolução, com as duas em cena. */
const passagem = await abrirEmCamaLenta(900);
checar(
  passagem.capa > 0.05 && passagem.capa < 0.99 && passagem.proposta > 0.05,
  `convite e proposta se sobrepõem na passagem (${passagem.capa.toFixed(2)} sobre ${passagem.proposta.toFixed(2)})`,
  "a proposta só aparece depois de o convite sumir: volta o quadro de tela vazia no meio",
);
await pgConvite.screenshot({ path: `${SAIDA}/390-passagem.png` });
await ctxConvite.close();

/* ───────── o convite em PONTEIRO FINO (desktop) ─────────

   Existe porque um defeito real passou batido: a frente do envelope usa
   `.cartao-luz`, que só é declarada dentro de `@media (hover: hover) and
   (pointer: fine)` e traz `position: relative`. Mesma especificidade da regra
   do envelope, declarada depois, ela vencia: no celular nada acontecia, no
   desktop o endereçamento saía de dentro do envelope e ia parar no fundo
   escuro. Nenhum teste de viewport de celular pega isso. */
console.log("\n▸ convite em ponteiro fino");
const ctxFino = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pgFino = await ctxFino.newPage();
await pgFino.goto(BASE + CAMINHO, { waitUntil: "networkidle" });
await pgFino.waitForTimeout(3600);

const dentro = await pgFino.evaluate(() => {
  const caixa = (sel) => document.querySelector(sel)?.getBoundingClientRect();
  const env = caixa(".convite-envelope");
  const cabe = (r) =>
    Boolean(r) && r.top >= env.top - 1 && r.bottom <= env.bottom + 1 &&
    r.left >= env.left - 1 && r.right <= env.right + 1;
  return {
    achou: Boolean(env),
    endereco: cabe(caixa(".convite-endereco")),
    canto: cabe(caixa(".convite-canto-esq")),
    lacre: cabe(caixa(".convite-lacre-area")),
  };
});
checar(dentro.achou, "o envelope existe no DOM", "seletor .convite-envelope vazio, a checagem passaria no vácuo");
checar(dentro.endereco, "endereçamento dentro do envelope", "o endereçamento saiu de dentro do envelope em ponteiro fino");
checar(dentro.canto, "remetente e validade dentro do envelope", "os cantos saíram de dentro do envelope em ponteiro fino");
checar(dentro.lacre, "lacre dentro do envelope", "o lacre saiu de dentro do envelope em ponteiro fino");

/* E a paralaxe: dois números escritos pelo ponteiro, traduzidos pelo CSS. Sem
   ponteiro fino ela nem é montada, então este é o único lugar que a exercita. */
await pgFino.mouse.move(120, 120);
await pgFino.waitForTimeout(800);
const esquerda = await pgFino.evaluate(() => ({
  palco: getComputedStyle(document.querySelector(".convite-palco")).transform,
  foco: getComputedStyle(document.querySelector(".convite-foco")).transform,
}));
await pgFino.mouse.move(1320, 780);
await pgFino.waitForTimeout(800);
const direita = await pgFino.evaluate(() => ({
  palco: getComputedStyle(document.querySelector(".convite-palco")).transform,
  foco: getComputedStyle(document.querySelector(".convite-foco")).transform,
}));
/* Com o tilt, `.convite-palco` computa `matrix3d` e `.convite-foco` continua em
   `matrix` 2D. Nos dois o deslocamento em x é a coluna de translação (m41): a
   matriz de perspectiva só mexe em m34 e as rotações vêm depois do translate.
   Lendo só o formato 2D, a paralaxe passaria a devolver 0 e a asserção falharia
   calada, dizendo que o efeito quebrou quando ele está funcionando. */
const desloca = (t) => {
  const m3 = t.match(/^matrix3d\((?:[-\d.e+]+,\s*){12}(-?[\d.e+]+)/);
  if (m3) return Number(m3[1]);
  const m2 = t.match(/^matrix\([-\d.e+]+, [-\d.e+]+, [-\d.e+]+, [-\d.e+]+, (-?[\d.e+]+)/);
  return m2 ? Number(m2[1]) : 0;
};
checar(
  desloca(esquerda.palco) < -1 && desloca(direita.palco) > 1,
  `paralaxe segue o ponteiro (${desloca(esquerda.palco).toFixed(1)}px a ${desloca(direita.palco).toFixed(1)}px)`,
  "o envelope não reagiu ao ponteiro: --px/--py ou o calc() do CSS quebraram",
);
checar(
  desloca(esquerda.foco) > 1 && desloca(direita.foco) < -1,
  "o foco de luz anda ao contrário da peça (é isso que cria profundidade)",
  "o foco de luz anda junto com o envelope, então não há profundidade nenhuma",
);

/* O ponteiro no botão ENTREABRE o envelope. Depende de `:has()` e de a animação
   de fechamento ter soltado o elemento (`fill: backwards`): trocar para `both`
   crava o estado final e mata o hover em silêncio. */
const abaFino = () =>
  pgFino.evaluate(() => {
    const t = getComputedStyle(document.querySelector(".convite-aba")).transform;
    const m = t.match(/matrix3d\(1, 0, 0, 0, 0, ([-\d.]+), ([-\d.]+)/);
    return m ? Math.round((Math.atan2(+m[2], +m[1]) * 180) / Math.PI) : 0;
  });
await pgFino.hover("#convite button");
await pgFino.waitForTimeout(700);
const abaComHover = await abaFino();
checar(
  abaComHover > 5,
  `a aba se levanta com o ponteiro no botão (${abaComHover}°)`,
  "a aba não reagiu ao hover: `:has()` ou o fill da animação de fechamento quebraram",
);
/* Positiva, e o sinal importa: para trás a ponta vai para z negativo, o 3D
   ordena certo e a aba desaparece atrás do corpo do envelope em vez de
   levantar. Já aconteceu. */
checar(
  abaComHover > 0,
  "e ela levanta para a FRENTE (para trás ela some atrás do envelope)",
  `a aba girou para trás (${abaComHover}°) e some atrás do corpo do envelope`,
);

/* E o outro lado da mesma moeda: tombando para a frente, a PONTA da aba avança
   em profundidade e pode passar POR CIMA do lacre. Aconteceu, e o carimbo
   aparecia cortado ao meio no hover. `elementFromPoint` no centro do lacre é a
   pergunta certa, porque ela mede a ordem que o 3D de fato resolveu, e não a
   que o CSS parece dizer. */
const quemEstaNoLacre = () =>
  pgFino.evaluate(() => {
    const r = document.querySelector(".convite-lacre").getBoundingClientRect();
    const alvo = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return {
      tapado: !alvo?.closest(".convite-lacre-area"),
      porQuem: (alvo?.className || "").toString().split(" ")[0] || alvo?.tagName,
    };
  });
const lacreComHover = await quemEstaNoLacre();
checar(
  !lacreComHover.tapado,
  "o lacre continua na frente com o ponteiro no botão",
  `a aba passou por cima do lacre no hover (no ponto está: ${lacreComHover.porQuem})`,
);
await pgFino.screenshot({ path: `${SAIDA}/1440-convite.png` });

await pgFino.mouse.move(60, 60);
await pgFino.waitForTimeout(600);
const lacreParado = await quemEstaNoLacre();
checar(
  !lacreParado.tapado,
  "e continua na frente em repouso",
  `algo cobre o lacre em repouso: ${lacreParado.porQuem}`,
);

/* E a respiração: sem ela a peça vira imagem parada depois que a cena acaba. */
const alturaDaPeca = () =>
  pgFino.evaluate(() => {
    const m = getComputedStyle(document.querySelector(".convite-peca")).transform.match(
      /matrix\(1, 0, 0, 1, [-\d.]+, ([-\d.]+)\)/,
    );
    return m ? Number(m[1]) : null;
  });
await pgFino.mouse.move(200, 200);
await pgFino.waitForTimeout(400);
const respiro1 = await alturaDaPeca();
await pgFino.waitForTimeout(2200);
const respiro2 = await alturaDaPeca();
checar(
  respiro1 !== null && respiro2 !== null && Math.abs(respiro1 - respiro2) > 0.5,
  `o envelope respira (${respiro1?.toFixed(1)}px para ${respiro2?.toFixed(1)}px)`,
  "o envelope ficou parado depois da cena: a peça vira imagem em vez de objeto",
);
await ctxFino.close();

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

/* ───────────── marca e compartilhamento ───────────── */
/* O card e o favicon so quebram em EXECUCAO, nunca no build: foi assim que a
   fonte variavel derrubou a rota de imagem inteira, com o link chegando sem
   card e ninguem percebendo. Por isso eles viram teste. */
console.log("\n▸ marca e compartilhamento");
const apiMarca = await request.newContext();

/* `/favicon.ico` na RAIZ é obrigatório, e por muito tempo não existia: a página
   declarava só `<link rel="icon" href="/icon.png">`, que serve para o navegador
   mas não para quem busca o ícone do site no caminho fixo. A Vercel é um desses:
   ela puxa `/favicon.ico` do deploy para usar como avatar do projeto, não achava,
   e o projeto ficava com o triângulo padrão. Vale para vários leitores de link. */
for (const [rota, nome] of [
  ["/favicon.ico", "favicon.ico na raiz"],
  ["/icon.png", "ícone do navegador"],
  ["/apple-icon.png", "ícone do iOS"],
]) {
  const r = await apiMarca.get(`${BASE}${rota}`);
  checar(
    r.status() === 200 && r.headers()["content-type"]?.startsWith("image/"),
    `${nome} responde imagem`,
    `${nome} devolveu ${r.status()} (${r.headers()["content-type"]})`,
  );
}

for (const [rota, nome] of [
  ["/opengraph-image", "card da raiz"],
  [`${CAMINHO}/opengraph-image`, "card da proposta"],
]) {
  const r = await apiMarca.get(`${BASE}${rota}`);
  const corpo = await r.body();
  checar(
    r.status() === 200 && corpo.subarray(1, 4).toString() === "PNG",
    `${nome} gera PNG`,
    `${nome} devolveu ${r.status()} e ${corpo.length} bytes: fonte variável na rota de imagem?`,
  );
  /* Card vazio tambem sai como PNG valido; o peso e o que denuncia. */
  checar(
    corpo.length > 20_000,
    `${nome} tem conteúdo (${Math.round(corpo.length / 1024)} KB)`,
    `${nome} saiu com apenas ${Math.round(corpo.length / 1024)} KB, provavelmente vazio`,
  );
}
await apiMarca.dispose();

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
