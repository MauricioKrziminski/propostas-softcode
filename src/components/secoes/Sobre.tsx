import { Secao } from "@/components/ui/Secao";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import type { Sobre as Dados } from "@/lib/proposta/schema";

export function Sobre({ dados }: { dados: Dados }) {
  return (
    <Secao
      id="sobre"
      etiqueta="08"
      titulo={dados.titulo ?? "Sobre a SoftCode"}
    >
      <Revelar como="p" className="text-lg leading-relaxed text-neblina">
        {dados.texto}
      </Revelar>

      {dados.cases && dados.cases.length > 0 && (
        <ListaRevelada className="mt-12 space-y-px">
          {dados.cases.map((caso) => (
            <ItemRevelado
              key={caso.cliente}
              como="article"
              className="case-item cartao-luz border border-linha p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg text-osso">{caso.cliente}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-acento">
                  {caso.segmento}
                </p>
              </div>
              <p className="mt-3 text-neblina">{caso.resultado}</p>
              {caso.url && (
                <a
                  href={caso.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  referrerPolicy="no-referrer"
                  className="alvo-toque mt-3 inline-flex items-center text-sm text-acento underline underline-offset-4"
                >
                  Ver o case
                </a>
              )}
            </ItemRevelado>
          ))}
        </ListaRevelada>
      )}
    </Secao>
  );
}
