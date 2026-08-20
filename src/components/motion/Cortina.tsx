"use client";

import type { ReactNode } from "react";
import { cubicBezier, motion, useReducedMotion, useTransform } from "motion/react";

import { usePercurso } from "./percurso";
import { useAlturaDaJanela } from "./midia";

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
export function Cortina({
  tom,
  capitulo,
  children,
}: {
  /** Um dos três tons decididos pela página: claro, azul claro ou noite. */
  tom: string;
  capitulo: "dia" | "noite";
  children: ReactNode;
}) {
  const menosMovimento = useReducedMotion();
  const altura = useAlturaDaJanela();

  /* 0 quando o FIM do bloco encosta no fim da tela, 1 quando esse mesmo fim
     chega ao topo. Entre os dois o dedo anda exatamente uma tela, que é a
     duração do congelamento. */
  const { alvo: congelaRef, progresso } = usePercurso(["end end", "end start"]);
  const y = useTransform(progresso, [0, 1], [0, altura]);

  /* A ENTRADA do mesmo bloco: 0 quando o topo dele encosta na base da tela, 1
     quando esse topo chega ao alto. É a janela em que ele está SUBINDO por cima
     do anterior, e é outra medida que a do congelamento (aquela olha o fim do
     bloco, esta olha o começo). Duas medidas porque são dois momentos: todo
     bloco primeiro sobe por cima do anterior e só muito depois congela. */
  const { alvo: entradaRef, progresso: entrada } = usePercurso(["start end", "start start"]);

  /* A borda de cima nasce BEM redonda e endurece conforme o bloco toma a tela.
     É o que faz a leitura de FOLHA subindo por cima da outra em vez de corte
     reto passando: reto, o olho lê um wipe; curvo, ele lê papel.

     A curva fecha em 0.72 e não em 1: a última fração da subida é justamente
     quando a aresta encosta no alto da tela, e chegar lá ainda arredondado
     deixaria dois cantinhos do bloco anterior aparecendo no topo. Ao endurecer
     antes, a folha se assenta e vira página. */
  const raio = useTransform(entrada, [0, 0.72], ["2.75rem", "0rem"], {
    clamp: true,
    /* Curva de entrada, e não linear: a folha SEGURA o arredondado durante quase
       toda a subida e só endurece no fim, quando encosta no alto. Linear, o
       raio já estava quase reto no meio do caminho e o gesto lia como um wipe
       que por acaso começou torto. */
    ease: cubicBezier(0.7, 0, 0.84, 0),
  });

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
          ? { backgroundColor: tom }
          : /* `willChange: auto` de propósito: o motion deixaria
               `will-change: transform` cravado, e quinze camadas compostas
               permanentes é exatamente o custo que este desenho existe para
               evitar. O transform ainda promove a camada quando está em uso. */
            {
              backgroundColor: tom,
              y,
              borderTopLeftRadius: raio,
              borderTopRightRadius: raio,
              willChange: "auto",
            }
      }
    >
      {children}
    </motion.div>
  );
}
