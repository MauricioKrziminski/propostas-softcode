/**
 * Divisor de ondas entre seções.
 *
 * É ele que faz a troca de cor de fundo entre uma seção e a seguinte — a
 * separação fica explícita, e a passagem acontece dentro da onda em vez de numa
 * borda reta.
 *
 * Três camadas com velocidades diferentes correm lateralmente conforme a página
 * rola (`animation-timeline: view()`), o que dá a sensação de maré. Só
 * `translateX` é animado, e cada camada é o dobro da largura da tela para poder
 * deslizar 50% sem deixar buraco.
 *
 * Sem suporte a scroll-driven ou com reduced-motion, as ondas continuam lá,
 * paradas: a separação entre as seções não depende do movimento.
 */
export function DivisorOnda({
  deCima,
  paraBaixo,
  invertido = false,
}: {
  /** Cor da seção que termina (topo do divisor). */
  deCima: string;
  /** Cor da seção que começa (base do divisor). */
  paraBaixo: string;
  /** Espelha o desenho, para duas transições seguidas não ficarem idênticas. */
  invertido?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="relative h-24 w-full overflow-hidden sm:h-36"
      style={{ backgroundColor: paraBaixo }}
    >
      <div
        className="absolute inset-0"
        style={{ transform: invertido ? "scaleX(-1)" : undefined }}
      >
        {/* camada de trás: mais lenta, na cor da seção que termina */}
        <svg
          className="onda-mare absolute inset-y-0 left-0 h-full w-[200%]"
          style={{ ["--mare-ate" as string]: "-14%" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill={deCima}
        >
          <path d="M0 0h1440v78c-120 26-240 39-360 39s-240-13-360-39S180 13 60 13L0 16z" opacity="0.45" />
        </svg>

        {/* camada do meio */}
        <svg
          className="onda-mare absolute inset-y-0 left-0 h-full w-[200%]"
          style={{ ["--mare-ate" as string]: "-26%" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill={deCima}
        >
          <path d="M0 0h1440v58c-160 34-320 51-480 51S640 92 480 58 160 7 0 24z" opacity="0.7" />
        </svg>

        {/* camada da frente: opaca, é ela que fecha a cor da seção anterior */}
        <svg
          className="onda-mare absolute inset-y-0 left-0 h-full w-[200%]"
          style={{ ["--mare-ate" as string]: "-40%" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill={deCima}
        >
          <path d="M0 0h1440v34c-200 40-400 60-600 60S440 74 240 34 40 0 0 6z" />
        </svg>

        {/* fio de índigo acompanhando a crista da onda da frente */}
        <svg
          className="onda-mare absolute inset-y-0 left-0 h-full w-[200%]"
          style={{ ["--mare-ate" as string]: "-40%" }}
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 6c40-6 40 0 240 28s360 60 600 60 400-20 600-60"
            stroke="var(--color-acento)"
            strokeWidth="2"
            strokeOpacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
