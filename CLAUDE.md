@AGENTS.md

# propostas-softcode

## Contexto

Site de **propostas comerciais da SoftCode**: apresentação e envio de propostas
para clientes. A página pública é alimentada pelo Postgres do Supabase, validado
pelo mesmo schema Zod que os componentes usam. O `/admin` monta e edita as
propostas.

Cada ação do cliente na proposta dele vira linha em `proposta_eventos` e um
e-mail para a SoftCode, pelo Resend. A animação usa `motion`, não instalar GSAP
nem Lenis sem alinhamento (a decisão e o porquê estão no plano).

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
| `npm run valida:eventos` | Prova o registro de eventos e a deduplicação do e-mail |
| `npm run semear` | Insere as propostas de `src/seed/` no banco (idempotente pelo slug) |
| `npm run banco:gerar` | Gera SQL de migração a partir de `src/lib/banco/esquema.ts` |

Variáveis de ambiente em `.env.local` (modelo em `.env.example`): `DATABASE_URL`
(pooler de transação do Supabase, porta 6543), `ADMIN_SENHA_HASH`
(`node scripts/gerar-senha.mjs "senha"`), `SESSAO_SEGREDO` e, para os avisos de
evento, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` e `CONTACT_INBOX`.
Sem as quatro do Resend nada quebra: o evento continua sendo gravado e o envio
vira aviso no log.

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
- **O convite é um ENVELOPE LACRADO sobre fundo noite.** O fundo escuro não é
  gosto: é o que faz o papel claro brilhar e o que dá contraste à abertura. O
  lacre também não é enfeite: aqui a autorização é a posse do token na URL, e
  lacre diz exatamente "preparado para você, ninguém abriu antes".
- **É a face de TRÁS do envelope, não a da frente.** A frente (retângulo com um
  V no topo) é o desenho de "e-mail" de qualquer barra de aplicativo, e não tem
  como fugir disso mantendo a frente: quanto mais o V some, menos parece
  envelope; quanto mais ele cresce, mais parece ícone. A face de trás resolve os
  dois lados: aba grande descendo de cima, aba de baixo subindo do rodapé, e o
  lacre no encontro das duas. Duas dobras se encontrando é o que o olho lê como
  construção de papel.
- **Endereçamento à ESQUERDA, lacre centralizado.** Tudo centralizado num
  retângulo é composição de cartão de visita; envelope endereçado tem o bloco do
  destinatário à esquerda e o lacre no eixo do papel. São dois eixos diferentes,
  e é essa tensão que faz a peça parecer desenhada em vez de empilhada.
- **A aba de trás não passa de 36% e o bloco começa abaixo do lacre.** O lacre
  mora no vértice da aba, e com nome de cliente de duas linhas o bloco cresce
  para cima: aba mais funda empurra o carimbo para cima da etiqueta. O
  `valida:mobile` troca o nome no DOM por um longo e mede de novo, porque a
  proposta semeada tem nome curto e a checagem passaria no vácuo.
- **O papel do envelope é ESCURO e o forro dele é claro.** Papelaria de alto
  padrão faz exatamente isso, e no produto resolve três coisas de uma vez: o
  envelope deixa de ser mais um retângulo branco entre outros retângulos brancos
  e vira objeto; a carta que sai de dentro é BRANCA, então a saída ganha o
  contraste que faltava (papel claro emergindo de papel escuro, e não branco
  saindo de branco); e o lacre inverte junto, de cera escura para cera perolada,
  voltando a ser a coisa mais clara da peça, que é onde o olho precisa ir. A
  tinta é clara sobre escuro: é impressão em foil, não em preto.
- **A mesa precisa ser mais ESCURA que o envelope**, senão objeto escuro sobre
  fundo escuro vira mancha. E o recorte vem da ARESTA: fio de luz na borda de
  cima e nas laterais, sombra funda embaixo. Sem isso o envelope encosta no
  fundo e some. Em papel escuro o grão também precisa de mais opacidade: é ele
  que impede o navy de virar plástico.
- **Cera MATE, nunca pastilha.** Gradiente radial forte mais anel de luz dura
  transformam o lacre num botão de interface. Cera de verdade tem a luz
  espalhada e a borda um pouco irregular, não brilho especular no canto.
- **A troca de face da aba é por OPACIDADE dentro dos keyframes da rotação, não
  por `backface-visibility`.** Com as duas faces em `preserve-3d`, uma girada
  180 graus e as duas com `backface-visibility: hidden`, o computado sai
  exatamente como o esperado nos dois motores e mesmo assim o forro aparece por
  cima com a aba FECHADA: o `clip-path` de cada face é propriedade de
  agrupamento, a face vira grupo achatado e o verso deixa de ser escondido. A
  troca cai no quadro dos 90 graus, onde a aba está de perfil e tem largura
  zero, então é literalmente invisível.
- **Na abertura, o envelope INTEIRO precisa se apagar antes de a câmera
  avançar.** A aba é pintada na frente da carta (`translateZ` maior), então
  cobrir a viewport com a carta não basta: com a aba ainda opaca sobrava uma
  faixa navy atravessada no alto da tela justo no quadro em que o papel deveria
  ter tomado tudo.
- **O endereçamento é FLEX em coluna, nunca grid.** Item de grid tem
  `align-self: stretch` por padrão e sua altura passa a vir da trilha, não do
  conteúdo: com nome de duas linhas uma trilha saía menor que o texto e o
  recorte de linha comia metade do escopo.
- **O envelope se MONTA na frente do cliente e depois se abre.** Ele chega com a
  aba levantada, o endereço é escrito enquanto ela cai (em paralelo, senão o
  envelope fica meio segundo em branco esperando a vez do texto), e só com a aba
  baixada o lacre prensa. Depois disso ele RESPIRA devagar, para sempre: peça
  parada em tela cheia lê como imagem, e o movimento lento é o que a mantém
  objeto justo enquanto a pessoa decide se clica.
- **Abrir não troca de tela, ABRE o envelope.** O lacre rompe, a aba gira para
  trás em 3D (`perspective` no pai, `preserve-3d` no filho, e é por isso que ela
  passa por trás do corpo depois dos 90 graus sem `z-index` nenhum), a carta sobe
  de dentro e a câmera entra nela. São cinco animações encadeadas em CINCO
  elementos diferentes: duas no mesmo elemento fazem a segunda apagar a primeira.
- **A animação de fechar a aba usa `backwards`, nunca `both`.** Com `both` o
  estado final fica cravado para sempre, nenhuma declaração de `transform` volta
  a valer, e o hover que levanta a aba morre em silêncio. Com `backwards` a
  animação solta o elemento no fim, e como o `to` do keyframe é idêntico ao
  repouso não há salto.
- **Animação com atraso e `from` VISÍVEL precisa de `forwards`, não `both`.** A
  onda do carimbo começa em `opacity: 0.5`; com `both` o navegador segura esse
  primeiro quadro durante todo o atraso, e um anel azul ficava parado em volta do
  lacre pelo primeiro segundo e meio. Ninguém pega isso olhando o estado final.
- **O hover levanta a aba PARA A FRENTE (`rotateX` positivo), e o lacre precisa
  de `translateZ` FOLGADO.** Para trás, que é o sentido da abertura de verdade, a
  ponta vai para z negativo e a aba desaparece atrás do corpo. Para a frente ela
  aparece, mas a ponta AVANÇA em profundidade: com 8 graus numa aba de ~119px são
  uns 17px, e o lacre a 4px ficava atrás dela, aparecendo cortado ao meio. Com
  28px o carimbo fica na frente em qualquer ângulo, e a perspectiva só cobra 2%
  de ampliação. A checagem certa é `elementFromPoint` no centro do lacre: ela
  mede a ordem que o 3D de fato resolveu, e não a que o CSS parece dizer.
- **A ordem da saída é o truque inteiro: COBRIR primeiro, dissolver depois.** A
  carta precisa tomar a viewport antes de a camada começar a se apagar. Fazendo
  as duas coisas juntas, o papel fica meio transparente no meio do caminho, a
  aresta de baixo dele corta a tela na horizontal, e "entrar na carta" vira
  "painel cinza passando". E a frente do envelope só se apaga DEPOIS de a carta
  estar meio caminho fora, senão ela parece atravessar o endereçamento em vez de
  sair de dentro. `SAIDA_MS` em `AberturaProposta.tsx` precisa casar com a última
  animação de `.convite-saindo`.
- **O lacre fica FORA da aba**, e por isso não gira com ela: ele rompe, ela abre.
  Fora também porque tem texto, e texto girando em 3D é re-rasterizado quadro a
  quadro no WebKit.
- **Nada de `data-capitulo="noite"` no `#convite`.** O fundo é escuro mas o
  ENVELOPE é claro, e o atributo faz `--ctx-titulo` virar quase branco para tudo
  que está dentro: o nome do cliente saía branco sobre papel branco, invisível.
  Dentro do convite cada cor é explícita.
- **Peça do convite que use classe declarada dentro de `@media` precisa de
  especificidade EXTRA.** A frente do envelope usa `.cartao-luz`, que só existe
  sob `(hover: hover) and (pointer: fine)` e traz `position: relative`: mesma
  especificidade, declarada depois, ela vencia o `position: absolute` do
  envelope. No celular nada acontecia; no desktop o endereçamento saía de dentro
  do envelope e ia parar no fundo escuro. Por isso o seletor é
  `.convite-3d .convite-frente`, e por isso `valida:mobile` tem um bloco em
  ponteiro fino: nenhum teste em viewport de celular pega essa classe de defeito.
- **O gesto memorável é UM: a luz de foil atravessando o nome do cliente**, que
  aqui é o endereço do envelope. Uma vez, sem repetir no hover nem no toque, e só
  DEPOIS de o convite já estar focado (1350ms). Referência premiada gasta de 1,5s
  a 4,5s porque é portfólio; aqui o cliente veio de um toque no WhatsApp em 4G.
- **A luz do nome é recorte de texto com DUAS animações que se cancelam.** A
  janela mascarada anda para um lado e o texto dentro dela anda para o outro,
  mesma largura e mesmo tempo, então só a luz viaja. É o jeito de recortar o
  brilho nos glifos sem animar `background-position` (e `mask-image` nem
  interpola, é propriedade discrete). A cópia iluminada é texto PURO:
  `background-clip: text` não enxerga texto dentro de `inline-block` filho, e com
  as caixas de recorte do original a camada simplesmente não aparecia. O `<h1>` é
  `fit-content`, senão metade do percurso da luz varre espaço vazio ao lado do
  nome. E `-webkit-text-fill-color` vai junto de `color`: no Safari o segundo
  sozinho não apaga o texto.
- **O foco vai para o DIÁLOGO, não para o botão.** `.focus()` sem interação
  anterior casa `:focus-visible` na maioria dos navegadores, e o resultado é um
  anel azul grosso desenhado sozinho em cima da peça principal, num aparelho onde
  ninguém está usando teclado. No contêiner com `role="dialog"` o leitor de tela
  anuncia o convite inteiro, e Enter e Esc já abrem de qualquer lugar.
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
- **O painel é `/painel`** (`/admin` só redireciona, para não quebrar link
  salvo). A rota `/painel` é a porta E a sala: sem sessão mostra a entrada, com
  sessão mostra a lista. Não existe rota separada de login.
- **No painel, toda página e toda action chamam `exigirAdmin()` na primeira
  linha.** O `proxy.ts` só faz checagem otimista de cookie; Server Action é
  endpoint HTTP e pode ser chamada sem passar por rota nenhuma.
- **Quem decide se o e-mail sai é o BANCO, não a aplicação.** A inserção em
  `proposta_eventos` é `on conflict do nothing` contra o índice único
  `(proposta_id, tipo, chave)`, e o aviso só é enviado se uma linha nasceu. Uma
  verificação, não duas. A `chave` define a janela: abrir, entrar e baixar usam
  a DATA (repetem no dia seguinte, não a cada F5), e o **aceite nunca
  deduplica**, porque perder um "abriu" não custa nada e engolir um "fechou
  negócio" custa a venda. O teto de 8 aceites por dia existe só para o botão
  não virar amplificador de e-mail para quem tem o link.
- **Evento nunca derruba a página.** Toda gravação e todo envio ficam dentro de
  `try`, e a rota `/api/eventos` responde 204 SEMPRE, achando a proposta ou não:
  um 404 ali diria "este slug existe", que é o que a página se recusa a dizer.
  Crawler de preview, prefetch, rascunho e sessão de admin não geram evento;
  sem esse filtro, colar o link no WhatsApp já avisaria "o cliente abriu", e
  conferir a própria proposta mandaria e-mail para si mesmo.
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

## Deploy: Vercel com DNS na Cloudflare

O site institucional (`softcodedev.com.br`) mora na Cloudflare. As propostas vão
para a Vercel em `propostas.softcodedev.com.br`, então quem manda no DNS continua
sendo a Cloudflare, e é lá que o subdomínio é apontado.

**Variáveis na Vercel** (Project Settings > Environment Variables), as mesmas do
`.env.local` mais uma: `DATABASE_URL` (pooler de transação, porta 6543),
`ADMIN_SENHA_HASH`, `SESSAO_SEGREDO`, `RESEND_API_KEY`, `EMAIL_FROM`,
`EMAIL_REPLY_TO`, `CONTACT_INBOX` e `NEXT_PUBLIC_URL_BASE`. O `CRON_SECRET` a
Vercel injeta sozinha ao criar o cron.

O `NEXT_PUBLIC_URL_BASE` importa duas vezes: ele monta o card do WhatsApp e é o
endereço do botão "Abrir a proposta" dentro do e-mail de aviso. E o domínio do
`EMAIL_FROM` precisa estar VERIFICADO no Resend, senão a API recusa e o aviso
nunca chega.

**O registro na Cloudflare:**

| Campo | Valor |
| --- | --- |
| Tipo | CNAME |
| Nome | `propostas` |
| Destino | o que a Vercel mostrar (`cname.vercel-dns.com` ou similar) |
| Proxy | **DNS only** (nuvem CINZA, não laranja) |

**A nuvem cinza não é detalhe.** Com o proxy da Cloudflare ligado:
  · a Vercel não consegue emitir o certificado, porque a validação passa a bater
    na Cloudflare em vez de no servidor dela;
  · se o modo SSL da Cloudflare estiver em "Flexible", o navegador entra em laço
    de redirecionamento e a proposta não abre;
  · e a proposta perde o `X-Robots-Tag` e os cabeçalhos que a Vercel manda, que
    são o que mantém tudo isto fora do Google.

**O cron do pulso** (`vercel.json`) bate em `/api/pulso` uma vez por dia. Ele
existe porque projeto Supabase gratuito PAUSA depois de sete dias sem requisição,
e banco pausado significa proposta que não abre justamente quando o cliente
demorou para ler o link. No plano Hobby da Vercel, cron diário é o que cabe, e é
o suficiente.

**Depois de subir**, conferir nesta ordem: `/painel` pede senha, uma proposta
real abre, o PDF baixa, e `curl -I` no domínio mostra `x-robots-tag: noindex`.

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
