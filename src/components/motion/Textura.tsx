/**
 * Grão sobre a página inteira.
 *
 * Um feTurbulence em data URI, em opacidade baixíssima: nenhuma requisição e
 * nenhum PNG no bundle, só para o branco não parecer cor chapada.
 *
 * A separação entre seções NÃO depende disto, quem faz o trabalho é a
 * alternância de fundo decidida pela página. Isto é só a textura por cima.
 *
 * O `GRAO` é exportado porque o convite precisa do MESMO grão numa camada
 * própria: este componente é `fixed z-[60]` e o convite é `z-[100]`, então a
 * capa passaria por cima da textura e nasceria de papel liso enquanto a
 * proposta atrás dela tem textura.
 */
export const GRAO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E";

export function Textura() {
  return (
    <div
      aria-hidden
      className="so-tela pointer-events-none fixed inset-0 z-[60] opacity-[0.02]"
      style={{ backgroundImage: `url("${GRAO}")`, backgroundRepeat: "repeat" }}
    />
  );
}
