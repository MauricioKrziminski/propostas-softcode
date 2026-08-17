import { Secao } from "@/components/ui/Secao";
import type { Sobre as Dados } from "@/lib/proposta/schema";

export function Sobre({ dados }: { dados: Dados }) {
  return (
    <Secao id="sobre" etiqueta="08" titulo={dados.titulo ?? "Sobre a SoftCode"}>
      <p className="text-lg leading-relaxed text-salvia" data-reveal>
        {dados.texto}
      </p>

      {dados.cases && dados.cases.length > 0 && (
        <div className="mt-12 space-y-px" data-stagger>
          {dados.cases.map((caso) => (
            <article
              key={caso.cliente}
              className="case-item cartao-luz border border-linha p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg text-osso">{caso.cliente}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-latao">
                  {caso.segmento}
                </p>
              </div>
              <p className="mt-3 text-salvia">{caso.resultado}</p>
              {caso.url && (
                <a
                  href={caso.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  referrerPolicy="no-referrer"
                  className="alvo-toque mt-3 inline-flex items-center text-sm text-latao underline underline-offset-4"
                >
                  Ver o case
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </Secao>
  );
}
