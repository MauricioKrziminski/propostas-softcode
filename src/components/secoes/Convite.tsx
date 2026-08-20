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
 * O convite: um ENVELOPE lacrado, pousado numa mesa escura.
 *
 * O clique não troca de tela, ele ABRE o envelope: o lacre se rompe, a aba gira
 * para trás em 3D, a carta sai de dentro e a câmera entra nela. A proposta não
 * "aparece", ela estava lá dentro o tempo todo. É a única transição que conta a
 * mesma história que a URL conta: alguém preparou isto, lacrou e mandou para
 * você.
 *
 * O fundo noite não é gosto: é o que faz o papel claro brilhar e o que dá o
 * contraste da abertura. A portaria do site já descreve este gesto, "uma peça
 * iluminada sobre fundo apagado".
 *
 * ── por que ele parece caro ─────────────────────────────────────────────────
 * Três detalhes de papelaria, e nenhum deles é enfeite de tela:
 *   · a aba é FORRADA. Por fora é papel claro, por dentro é azul profundo, que
 *     é o detalhe que uma gráfica cobra caro para fazer. Fechada só se vê o
 *     papel; ao abrir, o forro aparece. É a mesma peça contando que tem um
 *     dentro;
 *   · o LACRE é cera de verdade, não relevo apagado: disco navy com o
 *     monograma afundado. Ele é o único ponto escuro sobre o papel, então é
 *     para onde o olho vai primeiro, e é exatamente o que precisa ser rompido;
 *   · o papel tem GRÃO e tem ARESTA (fio de luz em cima, sombra embaixo). Sem
 *     isso, branco em tela é cor chapada, não material.
 *
 * ── a cena, e por que ela é esta ────────────────────────────────────────────
 *   60ms   as folhas de baixo caem, levemente tortas: o envelope tem ESPESSURA
 *          antes de ter texto;
 *   140ms  o envelope CHEGA, girado e de baixo, e assenta. Não é fade: papel
 *          pousa, não materializa. E chega ABERTO, mostrando o forro;
 *   420ms  a etiqueta é BATIDA letra por letra, como carimbo de correio;
 *   560ms  o nome do cliente é composto palavra por palavra, subindo de dentro
 *          do papel;
 *   620ms  ao mesmo tempo, a ABA CAI e se fecha, com um quique curto de papel.
 *          As duas coisas acontecem juntas de propósito: em sequência, o
 *          envelope ficava meio segundo em branco esperando a vez do texto;
 *   1100ms o convite recebe o foco e o botão está clicável;
 *   1340ms com a aba já baixada, o LACRE PRENSA e o papel devolve duas ondas;
 *   1820ms a luz de foil atravessa o nome, uma vez;
 *   2900ms daí em diante o envelope RESPIRA. Peça parada em tela cheia lê como
 *          imagem; o movimento lento é o que a mantém objeto.
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
      menos ? 0 : 1100,
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
   * O nome quebrado em palavras, cada uma na sua janela de recorte: a palavra
   * sobe de dentro do papel, como tipo sendo composto. Palavra, e não
   * caractere, porque caractere vira máquina de escrever, que é outro registro.
   */
  const palavras = empresa.trim().split(/\s+/);

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
        className={`${bodoni.variable} so-tela fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto bg-noite px-5 py-9 outline-none sm:px-8 sm:py-14 ${
          saindo ? "convite-saindo pointer-events-none" : ""
        }`}
      >
        {/* A mesa: foco frio de cima, vinheta nas bordas e o grão que tira o
            chapado do escuro. Tudo pintura estática, nada aqui anima. */}
        <div aria-hidden className="convite-foco pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: `url("${GRAO}")`, backgroundRepeat: "repeat" }}
        />

        {/* O palco carrega a PARALAXE, o envelope dentro dele carrega a CHEGADA.
            São dois `transform` em dois elementos porque um só sobrescreveria o
            outro, e a paralaxe mataria a animação de entrada. */}
        <div className="convite-palco relative w-full max-w-md">
          <div className="convite-peca">
            {/* Espessura: duas folhas por baixo, afinando e levemente tortas. */}
            <div aria-hidden className="convite-pilha">
              <span style={{ animationDelay: "60ms" }} />
              <span style={{ animationDelay: "120ms" }} />
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
                <article className="convite-frente cartao-luz">
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
                            style={{ animationDelay: `${420 + i * 26}ms` }}
                          >
                            {letra === " " ? " " : letra}
                          </span>
                        ))}
                      </span>
                    </p>

                    {/* `relative` é para a camada de luz: ela é absoluta sobre o
                        nome e precisa da MESMA caixa, senão a largura de
                        referência dos dois translates deixa de bater e o
                        reflexo desalinha. */}
                    <h1 className="tipo-display convite-nome relative">
                      {palavras.map((palavra, i) => (
                        /* O espaço fica FORA da caixa de recorte. Dentro dela
                           ele é cortado pelo `overflow: hidden` junto com o
                           resto, e "Barba Log" chega como "BarbaLog". */
                        <Fragment key={`${palavra}-${i}`}>
                          <span className="palavra-clip convite-caixa">
                            <span
                              className="convite-palavra"
                              style={{ animationDelay: `${560 + i * 70}ms` }}
                            >
                              {palavra}
                            </span>
                          </span>
                          {i < palavras.length - 1 ? " " : null}
                        </Fragment>
                      ))}

                      {/* A cópia iluminada é TEXTO PURO, sem as caixas de
                          recorte do original, e isso não é descuido:
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
                      <span style={{ animationDelay: "900ms" }}>{projeto}</span>
                    </p>
                    <p className="convite-linha convite-linha-fraca linha-clip">
                      <span style={{ animationDelay: "970ms" }}>Aos cuidados de {contato}</span>
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
