/**
 * Ritmo de fundo: a página deixa de ser cor chapada e ganha profundidade
 * progressiva conforme o scroll, como quem entra na mata.
 *
 * Duas camadas fixas atrás de todo o conteúdo:
 *   1. um gradiente alto entre --mata-fundo e --mata-superficie, deslocado por
 *      `scroll(root)` — variação de LUMINÂNCIA dentro da mesma matiz, nunca
 *      outra cor. Só `transform`;
 *   2. um grão de feTurbulence em opacidade baixíssima, que tira o aspecto de
 *      cor chapada. É um data URI: nenhuma requisição, nenhum PNG no bundle.
 *
 * Ambas são `.so-tela` — somem na impressão, onde o fundo é branco.
 */

const GRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E";

export function FundoMata() {
  return (
    <>
      <div
        aria-hidden
        className="so-tela fixed inset-x-0 top-0 -z-30 h-[300dvh] bg-[linear-gradient(180deg,var(--color-fundo)_0%,var(--color-superficie)_28%,var(--color-fundo)_52%,var(--color-superficie)_76%,var(--color-fundo)_100%)] camada-mata"
      />
      <div
        aria-hidden
        className="so-tela pointer-events-none fixed inset-0 -z-20 opacity-[0.05]"
        style={{ backgroundImage: `url("${GRAO}")`, backgroundRepeat: "repeat" }}
      />
    </>
  );
}
