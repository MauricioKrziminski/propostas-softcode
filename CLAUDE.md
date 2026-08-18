@AGENTS.md

# propostas-softcode

## Contexto

Site de **propostas comerciais da SoftCode**: apresentação e envio de propostas
para clientes. A página pública é alimentada pelo Postgres do Supabase, validado
pelo mesmo schema Zod que os componentes usam. O `/admin` monta e edita as
propostas.

Ainda **em aberto**: tracking de visualização, registro do aceite e e-mail
(Resend). A animação usa `motion`, não instalar GSAP nem Lenis sem alinhamento
(a decisão e o porquê estão no plano).

## Stack

- **Next.js 16** (App Router, `proxy.ts` no lugar do antigo middleware)
- **React 19**
- **Supabase (Postgres) + Drizzle ORM**, acesso 100% no servidor
- **TypeScript** (strict), alias de import `@/*` → `src/*`
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **ESLint 9** (flat config, `eslint-config-next`)
- Código-fonte em `src/`

## Package manager

**O package manager é npm.** Não use bun, pnpm ou yarn neste projeto.
O repositório deve conter apenas `package-lock.json`, qualquer outro lockfile
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
| `npm run semear` | Insere as propostas de `src/seed/` no banco (idempotente pelo slug) |
| `npm run banco:gerar` | Gera SQL de migração a partir de `src/lib/banco/esquema.ts` |

Variáveis de ambiente em `.env.local` (modelo em `.env.example`): `DATABASE_URL`
(pooler de transação do Supabase, porta 6543), `ADMIN_SENHA_HASH`
(`node scripts/gerar-senha.mjs "senha"`) e `SESSAO_SEGREDO`.

`valida:mobile` roda ao final de **toda** fase. Ele verifica, num viewport de
iPhone: overflow horizontal, alvos de toque de 44px, ausência de `100vh`,
reveals travados invisíveis, `prefers-reduced-motion` (nada animando e tudo
visível), a mídia `print` inteira (paleta invertida, nada `sticky`, `<details>`
abertos, nenhuma seção em branco), o foco de teclado e a ausência de travessão
no texto que o cliente lê. Salva screenshots e um PDF em `.playwright/`.

## Material de referência

Os orçamentos em PDF que a SoftCode já enviava estão em `Desktop/orçamento`
(geradores em Python + o handoff da Barba Log). De lá saíram a seção "O que
precisamos de você", os valores reais, a estrutura de pagamento (25% + 75%) e o
contato `softcodedv@gmail.com`. **Consulte antes de inventar conteúdo de
proposta**, o seed atual é a proposta real da Barba Log, não um exemplo.

## Regras do produto (não negociáveis)

- **`src/lib/proposta/schema.ts` é a fonte da verdade.** Todo campo tem
  `.describe()`: é o que vai gerar o formulário estruturado. Componente de
  seção recebe `z.infer` da sua fatia, nunca a proposta inteira.
- **Autorização = posse do token na URL.** Sem login. `{slug}-{token}` casa por
  comparação exata; slug sozinho e token errado dão o mesmo 404 genérico, que
  nunca revela se um slug existe.
- **Não existe rota de listagem.** Nada em `/` aponta para proposta alguma.
- **Proposta vencida não dá 404**, renderiza o estado "expirada" com CTA.
- **Mobile é o alvo, não o caso degradado.** Desenhe em 390px e expanda. `100dvh`
  sempre, `100vh` nunca.
- **Movimento:** só `transform` e `opacity`. Scroll-driven do CSS sob
  `@supports ((animation-timeline: view()) and (animation-range: 0% 100%))`,
  os dois juntos, senão suporte parcial trava o reveal invisível. Nenhum
  listener de evento `scroll`. Efeito de mouse só sob
  `(hover: hover) and (pointer: fine)`; no touch quem conduz é o scroll.
- **Estado de repouso vem ANTES do `@supports`.** Mesma especificidade dentro e
  fora do bloco: quem é declarado depois vence. Um `display: none` escrito
  abaixo do bloco anula o `display: flex` de dentro dele e o elemento nunca
  aparece: foi exatamente assim que o cabeçalho fixo ficou invisível por uma
  fase inteira sem ninguém notar.
- **A divisória entre seções é a própria diferença de cor**, e é SECA: sem
  gradiente, sem blur, sem curva. Os tons alternados são decididos pela página,
  nunca pela seção.
- **A etiqueta numérica da seção vem da POSIÇÃO**, via `rotulo(numero)`, nunca
  fixa no componente. Fixa, duas seções acabaram ambas com "08".
- **Vidro só pelas classes `.vidro`/`.vidro-sutil`.** Nunca `backdrop-blur-*` do
  Tailwind: ele emite só `backdrop-filter`, sem o prefixo, e em iOS 16-17 o vidro
  some. O prefixo NÃO dá para verificar em runtime (o Chromium apaga o alias do
  CSSOM), a checagem é no código-fonte. Teto de 5 elementos com vidro na página.
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
  "some"`, nunca uma fração. Com fração, bloco mais alto que a viewport perde o
  limiar no meio da leitura e some na cara de quem está lendo. O validador
  reprova quem voltar a `once: true`.
- **`@media print` é o PDF do cliente**, não sobra de CSS. Qualquer elemento
  novo que anime precisa entrar no reset de `src/styles/print.css`.
- **O painel tem sistema visual PRÓPRIO**, em `src/styles/mesa.css`, escopado em
  `.mesa`. Ele não usa os tokens da proposta e a proposta não usa os dele: um é
  cabine escura de ferramenta, o outro é documento claro. Misturar os dois foi o
  que deixou o painel com cara de rascunho da proposta.
- **A prévia do painel é a proposta DE VERDADE** num `<iframe>` de mesma origem
  (`?previa=1` pula o convite). Por isso `X-Frame-Options` é `SAMEORIGIN` e não
  `DENY`, com `frame-ancestors 'self'` dizendo o mesmo pela via moderna.
- **Dinheiro é inteiro em centavos.** Nunca float. E dinheiro derivado é
  CALCULADO, nunca guardado: o valor de cada parcela sai do total da opção
  recomendada (`valoresDasParcelas`), senão um reajuste deixa a tabela de
  pagamento mostrando o preço velho.
- **Migração de banco é arquivo SQL revisado**, em `drizzle/`, aplicado à parte.
  Nada de `drizzle-kit push` num banco que guarda proposta já enviada.
- **Leitura de proposta é TOLERANTE:** seção fora do formato é registrada no log
  e omitida, nunca derruba a página. Campo novo entra sempre opcional. O cliente
  abriu o link do WhatsApp; ele não pode receber 500.
- **`/admin`: toda página e toda action chamam `exigirAdmin()` na primeira
  linha.** O `proxy.ts` só faz checagem otimista de cookie; Server Action é
  endpoint HTTP e pode ser chamada sem passar por rota nenhuma.
- **Slug e token nunca mudam depois de criados.** Os dois formam o link que já
  está no WhatsApp do cliente. Precisando de endereço novo, duplique.

## Escrita (vale para tudo)

- **NUNCA, JAMAIS usar travessão (`—`) ou meia-risca (`–`) como pontuação entre
  palavras.** Nem no texto da proposta, nem em rótulo de botão, nem em assunto
  de e-mail, nem em comentário de código, nem em mensagem de commit, nem em
  título de página. Ele não é pontuação que gente usa no dia a dia, e no papel
  ainda se confunde com o marcador de lista.
- **No lugar dele, a pontuação usual:** dois-pontos quando o que vem depois
  explica o que veio antes; vírgula quando é continuação da mesma frase; ponto
  quando já são duas frases; parênteses quando é observação lateral.
- Isso vale também para o conteúdo do `src/seed/`: item de lista é
  `Rótulo: explicação`, nunca `Rótulo — explicação`. O marcador da lista já é o
  traço; um segundo traço na mesma linha é ruído.
- As réguas que separam blocos de comentário são traço de caixa (`─`, U+2500),
  outro caractere. Elas podem ficar; travessão dentro de frase, não.

## Convenções de commit

[Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição`

- Tipos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `build`, `ci`
- Descrição no imperativo e em minúsculas: `feat(propostas): adiciona listagem`
- Escopo é opcional
- Um commit por unidade lógica de mudança

### Autoria: o commit é só do autor humano

- **Nenhum commit leva coautoria de IA.** Nada de `Co-Authored-By: Claude`,
  `Co-Authored-By: ... <noreply@anthropic.com>`, `Generated with Claude Code`
  ou qualquer variação disso no corpo da mensagem, no rodapé, no título de PR
  ou na descrição de PR.
- **Por quê:** o trailer de coautoria faz o GitHub listar a IA como
  contribuidor do repositório, e este repositório tem um autor só. Já foi
  preciso reescrever as 18 mensagens do histórico uma vez para desfazer isso.
- **Vale para o agente:** se as instruções padrão da ferramenta mandarem
  assinar o commit, esta regra do projeto vence. Commit sem trailer nenhum.
- **Antes de commitar, confira:**
  `git log --format='%B' | grep -i 'co-authored\|anthropic\|generated with'`
  deve voltar vazio.
