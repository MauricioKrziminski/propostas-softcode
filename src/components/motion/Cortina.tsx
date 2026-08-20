"use client";

import type { ReactNode } from "react";
import { cubicBezier, motion, useMotionTemplate, useReducedMotion, useTransform } from "motion/react";

import { usePercurso } from "./percurso";
import { useAlturaDaJanela, useAlturaDoRodape, useLarguraDaJanela } from "./midia";

/**
 * A CORTINA: o capítulo seguinte sobe POR CIMA do anterior, que fica parado
 * embaixo, com aresta reta. É o gesto que separa um capítulo do outro, e ele
 * acontece em TODA fronteira, do hero ao rodapé.
 *
 * A mecânica em uma frase: quando o FIM do bloco encosta no fim da tela, ele
 * passa a ser empurrado para baixo na mesma medida em que a página sobe. A base
 * dele fica cravada no rodapé da viewport, a tela dele CONGELA, e o bloco
 * seguinte, em fluxo normal, sobe por cima. Uma tela de scroll depois o
 * seguinte já cobre tudo e o congelamento se solta sozinho.
 *
 * Nada de conteúdo se perde: o bloco rola INTEIRO até o fim dele chegar ao
 * rodapé da tela, ou seja, até você ter lido tudo, e só então congela.
 *
 * ── por que NÃO é `position: sticky` ────────────────────────────────────────
 * As três tentativas, todas medidas na página de verdade antes de desistir:
 *   · `top: 0` prende o TOPO. Seção mais alta que a tela (11 das 15 daqui, a do
 *     processo tem 6 telas) perde todo o miolo: ela gruda e o resto nunca
 *     chega. `investimento` perdia 1468px, `processo` perdia 3346px;
 *   · `bottom: 0` puxa a caixa PARA CIMA quando a posição de fluxo dela está
 *     mais abaixo, então todo bloco entrava em cena cedo demais. O `aceite`,
 *     último na ordem de pintura, cobriu o documento inteiro a partir do
 *     scroll 0;
 *   · `top: calc(100dvh - 100%)` não existe: em sticky a porcentagem dos insets
 *     resolve contra o SCROLLPORT, não contra o bloco contêiner e muito menos
 *     contra a altura do elemento. Medido com pista de sobra, computou 664px em
 *     TODAS as seções, da de 926px à de 4010px.
 * Falta a altura própria do bloco, e o CSS não sabe dizer isso. O motion sabe:
 * ele deriva o percurso do offset de LAYOUT do elemento.
 *
 * ── as duas condições, e as duas são obrigatórias ───────────────────────────
 *   · `min-h-[100dvh]`: bloco congelado precisa cobrir a tela inteira, senão
 *     seção curta deixa aparecer uma faixa da seção ANTERIOR (ou o branco do
 *     body) por cima da cortina subindo;
 *   · `relative z-0`: elemento transformado cria contexto de empilhamento e
 *     pinta com o grupo posicionado de `z-index: 0`. Um irmão NÃO transformado
 *     (progresso 0, `transform: none`) pintaria no passo de fluxo, ou seja, POR
 *     BAIXO do bloco congelado, e a cortina sairia invertida. Com todos
 *     posicionados em `z-index: 0`, quem decide é a ordem de árvore, sempre.
 *
 * A divisão continua SECA: só a troca de cor, sem gradiente, sem blur, sem
 * sombra na emenda. Os tons continuam sendo decididos pela PÁGINA.
 */
/**
 * A barriga do arco, como FRAÇÃO da largura da tela. 2,6% é o que a referência
 * mede (ajuste quadrático sobre a aresta, flecha de 2% a 3% da largura), e é
 * proporção e não px fixo porque o gesto tem de ler igual num telefone de 390px
 * e num monitor de 1920. Os limites existem para os dois extremos: abaixo de
 * 16px a curva vira imperfeição de renderização, acima de 56px ela deixa de ser
 * uma aresta e vira uma cúpula.
 */
const ARCO_FRACAO = 0.026;
const ARCO_MIN = 16;
const ARCO_MAX = 56;

export function Cortina({
  tom,
  capitulo,
  congela = true,
  children,
}: {
  /** Um dos três tons decididos pela página: claro, azul claro ou noite. */
  tom: string;
  capitulo: "dia" | "noite";
  /**
   * O congelamento existe para o capítulo SEGUINTE poder subir por cima. No
   * último não sobe ninguém: quem aparece embaixo dele é o rodapé, que fica
   * PARADO. Congelando, o último capítulo cravaria a base dele no rodapé da
   * tela e o rodapé nunca seria descoberto.
   */
  congela?: boolean;
  children: ReactNode;
}) {
  const menosMovimento = useReducedMotion();
  const altura = useAlturaDaJanela();
  const largura = useLarguraDaJanela();
  /* O rodapé é FIXO e fica por cima de tudo, então a faixa de baixo da janela
     não é área de leitura. A cortina precisa cravar a base do capítulo no TOPO
     do rodapé, e não no rodapé da janela: cravando na janela, a última fatia de
     cada capítulo ficaria para sempre escondida atrás dele. */
  const rodape = useAlturaDoRodape();
  const util = Math.max(0, altura - rodape);

  /* 0 quando o FIM do bloco encosta no fim da tela, 1 quando esse mesmo fim
     chega ao topo. Entre os dois o dedo anda exatamente uma tela, que é a
     duração do congelamento. */
  /* `end <util>px` e não `end end`: o zero do congelamento é o instante em que o
     fim do bloco encosta no TOPO DO RODAPÉ, e não no fim da janela. */
  const { alvo: congelaRef, progresso } = usePercurso([`end ${util}px`, "end start"]);
  const y = useTransform(progresso, [0, 1], [0, congela ? util : 0]);

  /* A ENTRADA do mesmo bloco: 0 quando o topo dele encosta na base da tela, 1
     quando esse topo chega ao alto. É a janela em que ele está SUBINDO por cima
     do anterior, e é outra medida que a do congelamento (aquela olha o fim do
     bloco, esta olha o começo). Duas medidas porque são dois momentos: todo
     bloco primeiro sobe por cima do anterior e só muito depois congela. */
  const { alvo: entradaRef, progresso: entrada } = usePercurso(["start end", "start start"]);

  /* A aresta de cima não é reta e não são cantos arredondados: é UM arco só,
     atravessando a linha inteira e estufando no meio, que achata conforme o
     bloco toma a tela. Medido na referência quadro a quadro: ajuste quadrático
     bate melhor que reta (RMS 5.96px contra 9.48px) e a flecha do arco no meio
     fica em torno de 2% a 3% da largura.

     A mecânica é `border-radius` com raio ELÍPTICO: raio horizontal de 50% em
     cada canto de cima faz as duas meias elipses se encontrarem exatamente no
     centro, e o que sobra é uma curva contínua de uma ponta à outra. Raio
     vertical animado de `--arco` até 0 é o que faz a curva "escorrer" e
     assentar. Sem os 50%, viram dois cantinhos redondos e o meio volta a ser
     reto, que é outro gesto. */
  const barriga = Math.min(ARCO_MAX, Math.max(ARCO_MIN, largura * ARCO_FRACAO));
  const arco = useTransform(entrada, [0, 0.88], [barriga, 0], {
    clamp: true,
    /* Curva de entrada, e não linear: o arco SEGURA a barriga durante quase
       toda a subida e só assenta no fim. Linear, ele já estava quase reto no
       meio do caminho e o gesto lia como um corte que por acaso começou torto. */
    ease: cubicBezier(0.65, 0, 0.85, 0),
  });
  const raio = useMotionTemplate`50% 50% 0 0 / ${arco}px ${arco}px 0 0`;

  /* Os dois `useScroll` precisam do MESMO nó. `usePercurso` devolve uma ref
     cada, e um `ref` de React só aceita uma: a função abaixo entrega o nó para
     as duas. Sem isso a segunda medida nunca teria alvo e o raio ficaria
     cravado no valor inicial, com a página inteira de cantos redondos. */
  const prender = (no: HTMLDivElement | null) => {
    congelaRef.current = no;
    entradaRef.current = no;
  };

  return (
    <motion.div
      ref={prender}
      data-capitulo={capitulo}
      className="cortina relative z-0 min-h-[100dvh]"
      style={
        menosMovimento
          ? { backgroundColor: tom, paddingBottom: congela ? undefined : rodape }
          : /* `willChange: auto` de propósito: o motion deixaria
               `will-change: transform` cravado, e quinze camadas compostas
               permanentes é exatamente o custo que este desenho existe para
               evitar. O transform ainda promove a camada quando está em uso. */
            {
              backgroundColor: tom,
              y,
              borderRadius: raio,
              /* Só o ÚLTIMO reserva o espaço do rodapé fixo. Ele é o único que
                 não congela, então a base dele para no fim do documento: sem
                 esse respiro, a última fatia dele ficaria atrás do rodapé para
                 sempre. Nos outros o congelamento já crava a base no topo do
                 rodapé e o respiro seria um buraco entre capítulos. */
              paddingBottom: congela ? undefined : rodape,
              willChange: "auto",
            }
      }
    >
      {children}
    </motion.div>
  );
}
