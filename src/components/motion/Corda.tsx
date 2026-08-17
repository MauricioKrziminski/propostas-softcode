/**
 * A divisória entre seções é a própria diferença de cor — não existe linha.
 *
 * A fronteira entre um tom e outro é uma curva suave (gradiente radial elíptico,
 * não um path de onda em SVG) que cede no meio como uma corda pendurada. Ela se
 * desloca verticalmente conforme a página rola: descendo, a corda afunda;
 * subindo, ela sobe de volta. O movimento é `translateY` conduzido por `view()`,
 * porque aqui o progresso do scroll É o conteúdo da animação.
 *
 * Sem suporte a scroll-driven ou com reduced-motion, a corda fica parada — e a
 * separação continua acontecendo, porque quem separa é a cor.
 */
export function Corda({
  deCima,
  paraBaixo,
  profundidade = 1,
}: {
  /** Cor da seção que termina. */
  deCima: string;
  /** Cor da seção que começa. */
  paraBaixo: string;
  /** Quanto a corda cede no meio. Varia entre divisórias para não repetir. */
  profundidade?: number;
}) {
  const alturaCurva = 68 + profundidade * 26;

  return (
    <div
      aria-hidden
      className="relative h-28 w-full overflow-hidden sm:h-44"
      style={{ backgroundColor: paraBaixo }}
    >
      <div
        className="corda absolute inset-x-[-10%] -top-[35%] h-[170%]"
        style={{
          /* A elipse desenha a barriga da corda: opaca no topo, dissolvendo
             na curva. Sem borda dura em ponto nenhum. */
          backgroundImage: `radial-gradient(140% ${alturaCurva}% at 50% 0%, ${deCima} 55%, transparent 78%)`,
        }}
      />
    </div>
  );
}
