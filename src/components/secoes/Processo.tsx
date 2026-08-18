import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar } from "@/components/motion/Revelar";
import { SecaoTravada } from "@/components/motion/SecaoTravada";
import { ETAPAS, type Etapa } from "@/lib/proposta/processo";
import type { Processo as Dados } from "@/lib/proposta/schema";

/**
 * A alma da página — capítulo NOITE, e a seção que trava.
 *
 * As 6 etapas não passam correndo: a seção prende na tela e cada etapa assume o
 * lugar da anterior conforme o dedo rola. É o formato que faz o cliente ler as
 * seis em vez de rolar por cima de uma lista.
 *
 * É capítulo escuro por dois motivos: o vidro só existe se houver algo atrás
 * dele, e o contraste com as seções claras é o que dá ritmo à página sem
 * precisar de divisória.
 *
 * Com reduced-motion a seção não trava — vira lista empilhada.
 */
export function Processo({ dados, numero }: { dados: Dados; numero: number }) {
  if (!dados.mostrar) return null;

  return (
    <Secao
      id="processo"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Como trabalhamos"}
      largura="ampla"
      ritmo="denso"
    >
      {dados.introducao && (
        <Revelar como="p" className="mb-10 max-w-3xl text-destaque leading-relaxed text-noite-neblina">
          {dados.introducao}
        </Revelar>
      )}

      <SecaoTravada
        etiquetaProgresso="Etapa"
        alturaPorItem={90}
        moldura="vidro p-7 sm:p-12"
        paineis={ETAPAS.map((etapa) => (
          <PainelEtapa key={etapa.numero} etapa={etapa} />
        ))}
      />
    </Secao>
  );
}

function PainelEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <article className="painel-etapa grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-12">
      {/* O numeral é o âncora visual: em Fraunces, gigante, e é o que dá
          escala ao painel inteiro. */}
      <span
        aria-hidden
        className="tipo-display tipo-display-wonk text-[clamp(3.5rem,14vw,8rem)] leading-[0.85] !text-acento-noite/35"
      >
        {String(etapa.numero).padStart(2, "0")}
      </span>

      <div>
        <h3 className="tipo-display text-secao leading-tight !text-noite-texto">
          {etapa.titulo}
        </h3>
        <p className="mt-4 max-w-2xl text-destaque leading-relaxed text-noite-neblina">
          {etapa.descricao}
        </p>

        <dl className="mt-8 grid max-w-2xl gap-6 border-t border-noite-linha pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="tipo-mono text-miudo uppercase tracking-[0.24em] text-acento-noite">
              Você recebe
            </dt>
            <dd className="mt-2 text-noite-texto">{etapa.entrega}</dd>
          </div>
          <div>
            <dt className="tipo-mono text-miudo uppercase tracking-[0.24em] text-noite-neblina">
              Sua parte
            </dt>
            <dd className="mt-2 text-noite-neblina">{etapa.suaParte}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
