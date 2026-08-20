"use client";

import { Fragment, useEffect, useRef } from "react";
import { Bodoni_Moda } from "next/font/google";

import { GRAO } from "@/components/motion/Textura";
import { formatarDataCurta } from "@/lib/proposta/formatar";

/**
 * A face do CONVITE, e só dele: a proposta continua em Fraunces.
 *
 * Didone é literalmente a letra do convite gravado e da papelaria em relevo, e
 * ela só é possível AQUI porque o envelope virou papel claro: hairline de
 * didone morre em texto claro sobre fundo escuro, o anti-aliasing come o traço
 * fino. Direção e tipografia se justificam uma à outra.
 *
 * O eixo `opsz` (6 a 96) é ÓPTICO de verdade: em 6 as hastes engrossam e o
 * contraste cai, em 96 as hairlines afinam e o contraste explode. É o que
 * permite duas letras visivelmente diferentes saindo de um arquivo só.
 *
 * Declarada no escopo deste módulo e não no `layout.tsx` de propósito: assim as
 * rotas do painel não pagam o preload de uma fonte que só a capa usa.
 */
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--fonte-convite",
  preload: true,
});

const ETIQUETA = "Proposta comercial";

/**
 * O convite: um ENVELOPE CLARO pousado numa mesa quase preta e VIVA.
 *
 * O clique não troca de tela, ele ABRE o envelope: o lacre se rompe, a aba gira
 * para trás em 3D, a carta sai de dentro e a câmera entra nela. A proposta não
 * "aparece", ela estava lá dentro o tempo todo. É a única transição que conta a
 * mesma história que a URL conta: alguém preparou isto, lacrou e mandou para
 * você.
 *
 * ── quatro camadas, cada uma com TETO de contraste ──────────────────────────
 * É o teto por camada, e não a quantidade de efeitos, que separa cena rica de
 * ruído:
 *   0  ATMOSFERA  aurora fluida sobre quase preto. Contraste muito baixo, duas
 *      derivas lentas (18s e 24s) que nunca param. É a luz andando que mantém a
 *      silhueta recortada continuamente, e não só no primeiro quadro;
 *   1  CONTEXTO   duas faixas de texto correndo em sentidos OPOSTOS atrás do
 *      envelope, com teto de contraste. A oclusão delas pelo envelope é a
 *      profundidade que o toque não pode ter por paralaxe de ponteiro;
 *   2  OBJETO     o envelope. Contraste máximo, e o único nítido da cena;
 *   3  AÇÃO       o botão, com uma brasa azul por baixo.
 *
 * ── por que ele parece caro ─────────────────────────────────────────────────
 * A separação vem de VALOR: papel greige sobre mesa quase preta recorta
 * sozinho. A versão anterior era navy sobre navy e por isso precisava de fio de
 * luz, grão reforçado e sombra funda só para o objeto não virar mancha: ela
 * resolvia um problema que ela mesma criava. Fora isso, três detalhes de
 * papelaria, e nenhum deles é enfeite de tela:
 *   · a aba é FORRADA. Por fora é papel claro, por dentro é tinta. Fechada só
 *     se vê o papel; ao abrir, o forro escuro aparece, e é contra ele que a
 *     carta clara sai;
 *   · o LACRE é cera escura: o único ponto escuro sobre o papel, então é para
 *     onde o olho vai primeiro, e é exatamente o que precisa ser rompido;
 *   · o papel tem GRÃO e tem duas sombras, uma de contato e uma de ambiente.
 *     Sobre campo quase preto a sombra é a única coisa que diz "flutuando".
 *
 * ── a cena, e por que ela é esta ────────────────────────────────────────────
 *   0ms    a mesa ACENDE: a aurora sobe do preto. As faixas já correm;
 *   80ms   as folhas de baixo caem, levemente tortas: o envelope tem ESPESSURA
 *          antes de ter texto;
 *   220ms  o envelope CHEGA, girado e de baixo, e assenta. Não é fade: papel
 *          pousa, não materializa. E chega ABERTO, mostrando o forro;
 *   620ms  a etiqueta é BATIDA letra por letra, como carimbo de correio;
 *   900ms  a ABA CAI e se fecha, com um quique curto de papel;
 *   940ms  ao mesmo tempo, o nome do cliente é DATILOGRAFADO, com um cursor que
 *          viaja com a batida. As duas coisas acontecem juntas de propósito: em
 *          sequência, o envelope ficava meio segundo em branco esperando o
 *          texto;
 *   1150ms o botão está em cena, aceso;
 *   1250ms o convite recebe o foco;
 *   1700ms com a aba já baixada, o LACRE PRENSA e o monograma GRAVA junto:
 *          cera cedendo e letra endurecendo são uma coisa só;
 *   1980ms o papel devolve duas ondas ao carimbo;
 *   2500ms a luz de foil atravessa o nome, uma vez. O pico da cena;
 *   3700ms daí em diante o envelope RESPIRA. Peça parada em tela cheia lê como
 *          imagem; o movimento lento é o que a mantém objeto.
 *
 * O botão NUNCA é travado: Enter, Esc e o clique valem desde 0ms. As regras
 * `.convite-saindo .x` têm especificidade maior e substituem a chegada, então
 * clicar no meio da montagem corta para o repouso e a abertura parte dali.
 *
 * ── a abertura, no clique ───────────────────────────────────────────────────
 *   0ms    o lacre se rompe (cresce, gira e some);
 *   40ms   a aba gira para trás em 3D, `rotateX`, dobrando na aresta de cima;
 *   320ms  a carta SOBE de dentro do envelope;
 *   440ms  a câmera entra na carta: o conjunto acelera na direção de quem olha,
 *          cobre a tela, e SÓ ENTÃO a noite se apaga.
 *
 * O 3D é de verdade (`perspective` mais `preserve-3d`), e é por isso que a aba
 * passa POR TRÁS do corpo do envelope depois dos 90 graus em vez de deslizar
 * por cima, e que o forro dela só aparece quando ela vira. O lacre fica FORA da
 * aba de propósito: ele tem texto, e texto girando em 3D é re-rasterizado
 * quadro a quadro no WebKit.
 *
 * Contratos que sobrevivem a qualquer redesenho desta tela:
 *   · SSR, então não há piscada da proposta antes do convite;
 *   · <noscript> o esconde, sem JS não haveria como fechá-lo;
 *   · `.so-tela` o tira da impressão (e `print.css` esconde `#convite`);
 *   · Esc e Enter também abrem, e o foco vai para o diálogo;
 *   · com reduced-motion nada anima: o envelope nasce fechado e montado, e
 *     abrir é um corte seco.
 */
export function Convite({
  empresa,
  projeto,
  contato,
  validaAte,
  saindo,
  aoAbrir,
}: {
  empresa: string;
  projeto: string;
  contato: string;
  validaAte: string;
  /** O envelope está abrindo. Quem controla é a AberturaProposta. */
  saindo: boolean;
  aoAbrir: () => void;
}) {
  const cenaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* O foco vai para o DIÁLOGO, não para o botão.
       Mandar para o botão também é prática válida, mas `.focus()` sem interação
       anterior casa `:focus-visible` na maioria dos navegadores, e o resultado
       é um anel azul grosso desenhado sozinho em cima da peça principal da
       tela, num aparelho onde ninguém está usando teclado. No contêiner com
       `role="dialog"` o leitor de tela anuncia o convite inteiro, quem usa
       teclado dá um Tab e chega ao botão, e Enter e Esc já abrem de qualquer
       lugar. */
    const t = window.setTimeout(
      () => cenaRef.current?.focus({ preventScroll: true }),
      menos ? 0 : 1250,
    );
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") aoAbrir();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", aoTeclar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Paralaxe de ponteiro: o envelope acompanha o cursor de leve.
   *
   * Só em ponteiro fino, e só sem reduced-motion. No toque quem conduz é o
   * dedo, e um objeto que persegue o dedo atrapalha o alvo de 44px.
   *
   * Escreve DUAS custom properties e mais nada: `--px`/`--py`, de -1 a 1. Quem
   * traduz isso em deslocamento é o CSS, em camadas com profundidades
   * diferentes, e quem amortece é uma `transition`, não uma mola em JS. Um
   * `requestAnimationFrame` coalescido por movimento, nenhum listener de
   * `scroll`, nenhuma leitura de layout (a conta é sobre a janela, que já está
   * na mão).
   */
  useEffect(() => {
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fino.matches || menos.matches) return;

    const cena = cenaRef.current;
    if (!cena) return;

    let agendado = 0;
    let x = 0;
    let y = 0;
    const aplicar = () => {
      agendado = 0;
      cena.style.setProperty("--px", x.toFixed(3));
      cena.style.setProperty("--py", y.toFixed(3));
    };
    const aoMover = (e: PointerEvent) => {
      /* Posição relativa à JANELA, não ao envelope: ele reage ao ponteiro em
         qualquer canto da tela, que é o que dá sensação de objeto no espaço em
         vez de botão com hover. */
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      agendado ||= requestAnimationFrame(aplicar);
    };

    window.addEventListener("pointermove", aoMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", aoMover);
      if (agendado) cancelAnimationFrame(agendado);
    };
  }, []);

  /**
   * O nome é DATILOGRAFADO, letra a letra, com um cursor que viaja com a
   * batida. O registro de máquina de escrever é uma escolha, não um descuido:
   * ele diz que a peça está sendo preparada AGORA, na frente de quem abriu.
   *
   * Cada PALAVRA é uma caixa `nowrap`: sem isso o navegador quebra entre dois
   * `inline-block` quaisquer e "Transportadora" chega partida no meio.
   *
   * O passo tem TETO. Com nome longo, `min()` aperta a cadência para a
   * datilografia terminar ANTES da luz de foil (2500ms), e não depois dela.
   */
  const palavras = empresa.trim().split(/\s+/);
  const totalLetras = palavras.reduce((n, p) => n + p.length, 0);
  const passo = Math.min(38, Math.round(860 / Math.max(totalLetras, 1)));
  /* Quantas letras vieram ANTES de cada palavra: é o que dá a posição de cada
     batida na fila. Derivado aqui, e não acumulado dentro do `map`, porque
     mutar durante a renderização é justamente o que o compilador do React
     recusa. */
  const antesDe = palavras.map((_, i) =>
    palavras.slice(0, i).reduce((n, p) => n + p.length, 0),
  );

  return (
    <>
      <noscript>
        <style>{`#convite{display:none!important}`}</style>
      </noscript>

      <div
        id="convite"
        ref={cenaRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Proposta para ${empresa}`}
        tabIndex={-1}
        /* NADA de `data-capitulo="noite"` aqui, por mais tentador que seja: o
           fundo é escuro, mas o ENVELOPE é claro, e o atributo faz
           `--ctx-titulo` virar quase branco para tudo que está dentro. O nome
           do cliente saía branco sobre papel branco, invisível. Aqui cada cor é
           explícita. */
        className={`${bodoni.variable} so-tela fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto bg-noite px-4 py-8 outline-none sm:px-8 sm:py-14 ${
          saindo ? "convite-saindo pointer-events-none" : ""
        }`}
      >
        {/* AS CAMADAS DE AMBIENTE, todas dentro de um recorte.

            O recorte não é zelo: `.convite-foco` tem `inset` NEGATIVO (a
            paralaxe o desloca, e sem folga a borda dele apareceria), e filho
            absoluto que passa da borda de baixo vira área ROLÁVEL do pai. Como
            o `#convite` é `overflow-y: auto` (para o convite continuar
            alcançável em tela baixa), sobrava uma faixa vazia de uns 200px
            abaixo do botão, e quem rolava achava que existia uma seção ali. O
            mesmo recorte também garante que a pista das faixas, que é
            `max-content`, nunca empurre a página de lado. */}
        <div aria-hidden className="convite-cena">
          {/* A mesa: aurora derivando, halo e vinheta fechando as bordas. */}
          <div className="convite-foco" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: `url("${GRAO}")`, backgroundRepeat: "repeat" }}
          />

          {/* CAMADA 1: as faixas. Correm ATRÁS do envelope e são ocluídas por
              ele, e é a oclusão, e não a velocidade, que cria a profundidade no
              toque. A pista carrega o conteúdo DUAS vezes: andar meia pista é o
              laço perfeito, sem emenda. */}
          <div className="convite-faixa convite-faixa-alta">
            <div className="convite-faixa-pista">
              {[0, 1].map((copia) => (
                <span key={copia}>
                  Proposta comercial
                  <i className="convite-pastilha" />
                  Preparada para você
                  <i className="convite-pastilha" />
                </span>
              ))}
            </div>
          </div>
          <div className="convite-faixa convite-faixa-baixa">
            <div className="convite-faixa-pista">
              {[0, 1].map((copia) => (
                <span key={copia}>
                  Confidencial
                  <i className="convite-pastilha" />
                  SoftCode
                  <i className="convite-pastilha" />
                  Documento único
                  <i className="convite-pastilha" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* O palco carrega a PARALAXE, o envelope dentro dele carrega a CHEGADA.
            São dois `transform` em dois elementos porque um só sobrescreveria o
            outro, e a paralaxe mataria a animação de entrada. */}
        <div className="convite-palco relative w-full max-w-lg">
          <div className="convite-peca">
            {/* Espessura: duas folhas por baixo, afinando e levemente tortas. */}
            <div aria-hidden className="convite-pilha">
              <span style={{ animationDelay: "80ms" }} />
              <span style={{ animationDelay: "150ms" }} />
            </div>

            {/* `perspective` mora aqui e `preserve-3d` no filho: é o par que faz
                a aba girar em profundidade de verdade, e não só encolher. */}
            <div className="convite-envelope">
              <div className="convite-3d">
                {/* A CARTA, dentro do envelope. Fechado, ela está inteiramente
                    atrás da frente; ao abrir, sobe e sai pela boca. */}
                <div aria-hidden className="convite-carta">
                  <span className="convite-carta-fio" />
                </div>

                {/* A FRENTE do envelope: é ela que leva o endereçamento. */}
                <article className="convite-frente">
                  {/* O verniz: o brilho largo que passeia no papel quando o
                      mouse anda. Substitui `.cartao-luz`, que pintava um halo
                      azul em `z-index: -1` e era invisível debaixo de papel
                      opaco. Em repouso fica parado no centro; quem o faz seguir
                      o ponteiro é o CSS, em ponteiro fino. */}
                  <span aria-hidden className="convite-verniz" />
                  <span
                    aria-hidden
                    className="convite-grao"
                    style={{ backgroundImage: `url("${GRAO}")`, backgroundRepeat: "repeat" }}
                  />

                  {/* A aba de BAIXO, que sobe do rodapé e é coberta pela de
                      cima. É ela que dá a construção de papel dobrado. */}
                  <span aria-hidden className="convite-base" />

                  <div className="convite-endereco">
                    {/* Etiqueta BATIDA letra por letra, como carimbo de correio.
                        O texto de verdade vai num `sr-only` e a versão fatiada é
                        `aria-hidden`: leitor de tela com o texto picado em spans
                        soletra letra por letra. */}
                    <p className="convite-etiqueta tipo-mono">
                      <span className="sr-only">{ETIQUETA}</span>
                      <span aria-hidden>
                        {[...ETIQUETA].map((letra, i) => (
                          <span
                            key={`${letra}-${i}`}
                            className="convite-letra"
                            style={{ animationDelay: `${620 + i * 26}ms` }}
                          >
                            {letra === " " ? " " : letra}
                          </span>
                        ))}
                      </span>
                    </p>

                    {/* `relative` é para a camada de luz: ela é absoluta sobre o
                        nome e precisa da MESMA caixa, senão a largura de
                        referência dos dois translates deixa de bater e o
                        reflexo desalinha.

                        `tipo-display` NÃO entra aqui: o nome tem face própria
                        (Bodoni), declarada em `.convite-nome`. A classe traria a
                        Fraunces de volta e a cor via `--ctx-titulo`. */}
                    <h1
                      className="convite-nome relative"
                      style={{ "--passo": `${passo}ms` } as React.CSSProperties}
                    >
                      {/* O texto de verdade vai num `sr-only` e a versão fatiada
                          é `aria-hidden`: leitor de tela com o nome picado em
                          spans soletra letra por letra. */}
                      <span className="sr-only">{empresa}</span>

                      <span aria-hidden>
                        {palavras.map((palavra, p) => (
                          /* O espaço fica FORA da caixa `nowrap`: dentro dela
                             ele participaria do não-quebrar e o nome inteiro
                             viraria uma linha só. */
                          <Fragment key={`${palavra}-${p}`}>
                            <span className="convite-palavra-nome" data-nome>
                              {[...palavra].map((letra, i) => (
                                <span
                                  key={`${letra}-${i}`}
                                  className="convite-tecla"
                                  style={{
                                    animationDelay: `${940 + (antesDe[p] + i) * passo}ms`,
                                  }}
                                >
                                  {letra}
                                </span>
                              ))}
                            </span>
                            {p < palavras.length - 1 ? " " : null}
                          </Fragment>
                        ))}

                        {/* O cursor que sobra no fim: pisca três vezes e morre. */}
                        <span
                          className="convite-cursor"
                          style={{ animationDelay: `${940 + totalLetras * passo}ms` }}
                        />
                      </span>

                      {/* A cópia iluminada é TEXTO PURO, sem os spans por letra
                          do original, e isso não é descuido:
                          `background-clip: text` recorta o gradiente no texto do
                          PRÓPRIO elemento, e texto que mora dentro de um
                          `inline-block` filho não entra nessa conta. Com as
                          caixas, a camada simplesmente não aparecia. */}
                      <span aria-hidden className="convite-foil">
                        <span className="convite-foil-texto">{empresa}</span>
                      </span>
                    </h1>

                    <span aria-hidden className="convite-regua" />

                    {/* Linhas inteiras subindo de dentro de um recorte: é o
                        mesmo gesto do nome, num grau abaixo. */}
                    <p className="convite-linha linha-clip">
                      <span style={{ animationDelay: "2240ms" }}>{projeto}</span>
                    </p>
                    <p className="convite-linha convite-linha-fraca linha-clip">
                      <span style={{ animationDelay: "2320ms" }}>Aos cuidados de {contato}</span>
                    </p>
                  </div>

                  {/* Os cantos: remetente à esquerda, validade à direita, no
                      lugar do selo postal. É o que faz a peça ler como
                      correspondência e não como cartão de visita. */}
                  <p className="convite-canto convite-canto-esq tipo-mono">SoftCode</p>
                  <p className="convite-canto convite-canto-dir tipo-mono">
                    Válida até {formatarDataCurta(validaAte)}
                  </p>
                </article>

                {/* A ABA, com DUAS faces: papel por fora, forro azul por dentro.
                    Sem texto: texto girando em 3D é re-rasterizado quadro a
                    quadro no WebKit. */}
                <div aria-hidden className="convite-aba">
                  <span className="convite-aba-fora" />
                  <span className="convite-aba-forro" />
                </div>

                {/* O LACRE fica fora da aba, e por isso não gira com ela: ele
                    rompe, ela abre. */}
                <div aria-hidden className="convite-lacre-area">
                  {/* DUAS ondas, defasadas: uma só lê como círculo crescendo,
                      duas leem como impacto. */}
                  <span className="convite-onda" />
                  <span className="convite-onda convite-onda-tardia" />
                  <span className="convite-lacre">
                    <span className="convite-lacre-marca">SC</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="convite-acao">
            <button type="button" onClick={aoAbrir} className="convite-botao alvo-toque varredura">
              <span className="convite-botao-texto">Abrir o convite</span>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                className="convite-seta"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>

            <p className="convite-nota tipo-mono">Leitura de cerca de 6 minutos</p>
          </div>
        </div>
      </div>
    </>
  );
}
