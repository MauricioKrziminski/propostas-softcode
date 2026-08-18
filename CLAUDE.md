@AGENTS.md

# propostas-softcode

## Contexto

Site de **propostas comerciais da SoftCode**: apresentação e envio de propostas
para clientes. A página pública está implementada e alimentada por um JSON em
`src/seed/`, validado pelo mesmo schema Zod que o banco vai usar.

Ainda **em aberto**: banco (Supabase decidido, não instalado), ORM (Drizzle
decidido) e o admin. A animação usa `motion` — não instalar GSAP nem Lenis sem
alinhamento (a decisão e o porquê estão no plano).

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict), alias de import `@/*` → `src/*`
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **ESLint 9** (flat config, `eslint-config-next`)
- Código-fonte em `src/`

## Package manager

**O package manager é npm.** Não use bun, pnpm ou yarn neste projeto.
O repositório deve conter apenas `package-lock.json` — qualquer outro lockfile
(`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`) é erro e deve ser removido.

Instalação de dependências: `npm install <pacote>`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (http://localhost:3000) |
| `npm run build` | Build de produção |
| `npm start` | Roda o build de produção |
| `npm run lint` | ESLint |
| `npm run valida:mobile` | Validação mobile em 390×844 real (com o dev server no ar) |

`valida:mobile` roda ao final de **toda** fase. Ele verifica, num viewport de
iPhone: overflow horizontal, alvos de toque de 44px, ausência de `100vh`,
reveals travados invisíveis, `prefers-reduced-motion` (nada animando e tudo
visível), a mídia `print` inteira (paleta invertida, nada `sticky`, `<details>`
abertos, nenhuma seção em branco) e o foco de teclado. Salva screenshots e um
PDF em `.playwright/`.

## Material de referência

Os orçamentos em PDF que a SoftCode já enviava estão em `Desktop/orçamento`
(geradores em Python + o handoff da Barba Log). De lá saíram a seção "O que
precisamos de você", os valores reais, a estrutura de pagamento (25% + 75%) e o
contato `softcodedv@gmail.com`. **Consulte antes de inventar conteúdo de
proposta** — o seed atual é a proposta real da Barba Log, não um exemplo.

## Regras do produto (não negociáveis)

- **`src/lib/proposta/schema.ts` é a fonte da verdade.** Todo campo tem
  `.describe()` — é o que vai gerar o formulário estruturado. Componente de
  seção recebe `z.infer` da sua fatia, nunca a proposta inteira.
- **Autorização = posse do token na URL.** Sem login. `{slug}-{token}` casa por
  comparação exata; slug sozinho e token errado dão o mesmo 404 genérico, que
  nunca revela se um slug existe.
- **Não existe rota de listagem.** Nada em `/` aponta para proposta alguma.
- **Proposta vencida não dá 404** — renderiza o estado "expirada" com CTA.
- **Mobile é o alvo, não o caso degradado.** Desenhe em 390px e expanda. `100dvh`
  sempre, `100vh` nunca.
- **Movimento:** só `transform` e `opacity`. Scroll-driven do CSS sob
  `@supports ((animation-timeline: view()) and (animation-range: 0% 100%))` —
  os dois juntos, senão suporte parcial trava o reveal invisível. Nenhum
  listener de evento `scroll`. Efeito de mouse só sob
  `(hover: hover) and (pointer: fine)`; no touch quem conduz é o scroll.
- **Estado de repouso vem ANTES do `@supports`.** Mesma especificidade dentro e
  fora do bloco: quem é declarado depois vence. Um `display: none` escrito
  abaixo do bloco anula o `display: flex` de dentro dele e o elemento nunca
  aparece — foi exatamente assim que o cabeçalho fixo ficou invisível por uma
  fase inteira sem ninguém notar.
- **A divisória entre seções é a própria diferença de cor**, e é SECA: sem
  gradiente, sem blur, sem curva. Os tons alternados são decididos pela página,
  nunca pela seção.
- **A etiqueta numérica da seção vem da POSIÇÃO**, via `rotulo(numero)` — nunca
  fixa no componente. Fixa, duas seções acabaram ambas com "08".
- **Vidro só pelas classes `.vidro`/`.vidro-sutil`.** Nunca `backdrop-blur-*` do
  Tailwind: ele emite só `backdrop-filter`, sem o prefixo, e em iOS 16-17 o vidro
  some. O prefixo NÃO dá para verificar em runtime (o Chromium apaga o alias do
  CSSOM) — a checagem é no código-fonte. Teto de 5 elementos com vidro na página.
- **`animation-timeline` só existe no iOS 26+ e nunca no Firefox.** Portanto: CSS
  scroll-driven é só para DECORAÇÃO. Todo efeito que o cliente precisa ver usa
  `useScroll` do motion, que é rAF e roda em todo iPhone.
- **Título de seção NUNCA é sticky.** Comia a viewport do celular e disputava
  atenção com o conteúdo. O validador falha se voltar.
- **Reveal de componente é por TEMPO, não por scroll.** `Revelar.tsx` (motion).
  Reveal preso ao `view()` para quando o dedo para, e quem rola rápido jura que
  não existe animação nenhuma. Scroll-driven fica só onde o progresso do scroll
  **é** o conteúdo: a corda, o filete do processo e o gesto do hero.
- **Reveal REPETE: `viewport.once` é sempre `false`,** e o limiar é `amount:
  "some"` — nunca uma fração. Com fração, bloco mais alto que a viewport perde o
  limiar no meio da leitura e some na cara de quem está lendo. O validador
  reprova quem voltar a `once: true`.
- **`@media print` é o PDF do cliente**, não sobra de CSS. Qualquer elemento
  novo que anime precisa entrar no reset de `src/styles/print.css`.
- **Dinheiro é inteiro em centavos.** Nunca float.

## Convenções de commit

[Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição`

- Tipos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `build`, `ci`
- Descrição no imperativo e em minúsculas: `feat(propostas): adiciona listagem`
- Escopo é opcional
- Um commit por unidade lógica de mudança
