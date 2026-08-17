import { formatarDataLonga, textoValidade } from "@/lib/proposta/formatar";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";

/**
 * ELEMENTO ASSINATURA da página.
 *
 * O nome da empresa do cliente entra em escala gigante e encolhe até dar lugar
 * ao cabeçalho fixo, conduzido por `scroll()` — não por mouse. É por isso que
 * funciona igual no celular, que é onde o link do WhatsApp vai ser aberto.
 *
 * Regras que este componente cumpre à risca:
 *   · o h1 é o LCP e nasce visível — nenhuma animação de entrada nele;
 *   · só `transform` e `opacity` são animados;
 *   · nenhum eixo de variable font é interpolado — isso causaria relayout por
 *     frame. O hero e o cabeçalho fixo são elementos distintos em crossfade.
 */
export function Hero({
  empresa,
  cliente,
  projeto,
  emitidaEm,
  validaAte,
  expirada,
}: {
  empresa: string;
  cliente: string;
  projeto: string;
  emitidaEm: string;
  validaAte: string;
  expirada: boolean;
}) {
  return (
    <header className="relative isolate flex min-h-[92dvh] flex-col justify-between overflow-hidden px-6 pb-12 pt-8 sm:px-8">
      {/* camadas de parallax — decorativas, transform apenas */}
      <div
        aria-hidden
        className="camada-parallax pointer-events-none absolute -right-1/4 top-[-10%] -z-10 h-[70dvh] w-[120vw] rounded-full bg-superficie/40 blur-3xl sm:w-[70vw]"
        style={{ ["--deslocamento" as string]: "-18%" }}
      />
      <div
        aria-hidden
        className="camada-parallax pointer-events-none absolute -left-1/3 bottom-[-20%] -z-10 h-[45dvh] w-[100vw] rounded-full bg-acento/5 blur-3xl sm:w-[55vw]"
        style={{ ["--deslocamento" as string]: "-8%" }}
      />

      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.28em] text-neblina">
        <LogoSoftCode className="h-24 w-auto sm:h-28" prioridade />
        <span className="numero">Proposta comercial</span>
      </div>

      <div className="assinatura-nome py-10">
        <p className="mb-5 text-sm uppercase tracking-[0.2em] text-acento">
          Proposta para
        </p>
        {/* LCP: sem animação de entrada, nasce visível */}
        <h1 className="tipo-display text-nome">{empresa}</h1>
      </div>

      <div className="grid gap-8 border-t border-linha pt-8 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neblina">Projeto</p>
          <p className="mt-2 text-lg leading-snug text-navy">{projeto}</p>
          <p className="mt-1 text-sm text-neblina">Aos cuidados de {cliente}</p>
        </div>
        <dl className="grid grid-cols-2 gap-6 text-sm sm:justify-items-end sm:text-right">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-neblina">Emissão</dt>
            <dd className="numero mt-2 text-navy">{formatarDataLonga(emitidaEm)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-neblina">Validade</dt>
            <dd className="numero mt-2 text-navy">{formatarDataLonga(validaAte)}</dd>
            <dd
              className={`mt-1 text-xs ${expirada ? "text-neblina" : "text-acento"}`}
            >
              {textoValidade(validaAte)}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

/**
 * A outra metade do gesto: aparece por opacidade quando o nome do hero termina
 * de encolher. Traz o logo do cliente à esquerda e o da SoftCode à direita.
 * Sem suporte a scroll-driven ou com reduced-motion, simplesmente não existe.
 */
export function CabecalhoFixo({
  empresa,
  logoCliente,
}: {
  empresa: string;
  logoCliente?: string;
}) {
  return (
    <div
      aria-hidden
      className="cabecalho-fixo fixed inset-x-0 top-0 z-50 h-[var(--altura-cabecalho)] items-center justify-between gap-4 border-b border-linha bg-fundo/85 px-6 backdrop-blur-sm sm:px-8"
    >
      <LogoCliente empresa={empresa} url={logoCliente} />
      <LogoSoftCode className="h-12 w-auto" />
    </div>
  );
}

/**
 * Slot do logo do cliente, sempre monocromático em osso.
 *
 * A cor não é customizável de propósito: logo colorido de terceiro brigaria com
 * o índigo da SoftCode e faria a proposta parecer um documento de duas marcas
 * mal costuradas. A monocromia vem de `mask-image` — a forma do arquivo recorta
 * uma área preenchida com --color-osso, então nenhum pixel da cor original passa.
 *
 * Sem logo, o nome da empresa em Playfair ocupa o mesmo lugar.
 */
function LogoCliente({ empresa, url }: { empresa: string; url?: string }) {
  if (!url) {
    return (
      <span className="tipo-display text-base tracking-tight text-navy">
        {empresa}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={empresa}
      className="block h-5 w-28 bg-osso"
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
