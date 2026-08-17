import { formatarDataLonga, textoValidade } from "@/lib/proposta/formatar";

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
 *   · o eixo `wdth` não é interpolado: `.assinatura-nome` (wdth 125) e o
 *     cabeçalho fixo (wdth 100) são elementos distintos que fazem crossfade.
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
        className="camada-parallax pointer-events-none absolute -left-1/3 bottom-[-20%] -z-10 h-[45dvh] w-[100vw] rounded-full bg-latao/5 blur-3xl sm:w-[55vw]"
        style={{ ["--deslocamento" as string]: "-8%" }}
      />

      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] text-salvia">
        <span className="tipo-display" style={{ fontVariationSettings: '"wght" 700, "wdth" 100' }}>
          SoftCode
        </span>
        <span className="numero">Proposta comercial</span>
      </div>

      <div className="assinatura-nome py-10">
        <p className="mb-5 text-sm uppercase tracking-[0.2em] text-latao">
          Proposta para
        </p>
        {/* LCP: sem animação de entrada, nasce visível */}
        <h1 className="tipo-display text-nome">{empresa}</h1>
      </div>

      <div className="grid gap-8 border-t border-linha pt-8 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-salvia">Projeto</p>
          <p className="mt-2 text-lg leading-snug text-osso">{projeto}</p>
          <p className="mt-1 text-sm text-salvia">Aos cuidados de {cliente}</p>
        </div>
        <dl className="grid grid-cols-2 gap-6 text-sm sm:justify-items-end sm:text-right">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-salvia">Emissão</dt>
            <dd className="numero mt-2 text-osso">{formatarDataLonga(emitidaEm)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-salvia">Validade</dt>
            <dd className="numero mt-2 text-osso">{formatarDataLonga(validaAte)}</dd>
            <dd
              className={`mt-1 text-xs ${expirada ? "text-salvia" : "text-latao"}`}
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
 * de encolher. Largura estática em wdth 100 — nenhuma interpolação de eixo.
 * Sem suporte a scroll-driven ou com reduced-motion, simplesmente não existe.
 */
export function CabecalhoFixo({ empresa }: { empresa: string }) {
  return (
    <div
      aria-hidden
      className="cabecalho-fixo fixed inset-x-0 top-0 z-50 items-center justify-between gap-4 border-b border-linha bg-fundo/85 px-6 py-3 backdrop-blur-sm sm:px-8"
    >
      <span
        className="tipo-display text-sm uppercase tracking-[0.12em]"
        style={{ fontVariationSettings: '"wght" 700, "wdth" 100' }}
      >
        {empresa}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-salvia">SoftCode</span>
    </div>
  );
}
