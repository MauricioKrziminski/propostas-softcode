import { Secao } from "@/components/ui/Secao";
import { Revelar } from "@/components/motion/Revelar";
import { SecaoTravada } from "@/components/motion/SecaoTravada";
import { ETAPAS, type Etapa } from "@/lib/proposta/processo";
import type { Processo as Dados } from "@/lib/proposta/schema";

/**
 * A alma da página — e a seção que TRAVA.
 *
 * As 6 etapas não passam correndo: a seção prende na tela e cada etapa assume
 * o lugar da anterior conforme o dedo rola. É o formato que faz o cliente ler
 * as seis, em vez de rolar por cima de uma lista.
 *
 * Com reduced-motion a seção não trava — vira lista empilhada.
 */
export function Processo({ dados }: { dados: Dados }) {
  if (!dados.mostrar) return null;

  return (
    <Secao
      id="processo"
      etiqueta="04"
      titulo={dados.titulo ?? "Como trabalhamos"}
      largura="ampla"
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-8 max-w-3xl text-lg leading-relaxed text-neblina">
          {dados.introducao}
        </Revelar>
      )}

      <SecaoTravada
        etiquetaProgresso="Etapa"
        alturaPorItem={90}
        paineis={ETAPAS.map((etapa) => (
          <PainelEtapa key={etapa.numero} etapa={etapa} />
        ))}
      />
    </Secao>
  );
}

function PainelEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <article className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-12">
      <span
        aria-hidden
        className="tipo-display text-[clamp(3rem,13vw,7rem)] leading-none !text-acento/25"
      >
        {String(etapa.numero).padStart(2, "0")}
      </span>

      <div>
        <h3 className="tipo-display text-secao leading-tight">{etapa.titulo}</h3>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neblina">
          {etapa.descricao}
        </p>

        <dl className="mt-8 grid max-w-2xl gap-6 border-t border-linha pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-acento">
              Você recebe
            </dt>
            <dd className="mt-2 text-navy">{etapa.entrega}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-neblina">
              Sua parte
            </dt>
            <dd className="mt-2 text-neblina">{etapa.suaParte}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
