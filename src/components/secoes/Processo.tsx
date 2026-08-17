import { Secao } from "@/components/ui/Secao";
import { ETAPAS } from "@/lib/proposta/processo";
import type { Processo as Dados } from "@/lib/proposta/schema";

/**
 * A alma da página — e a segunda (e última) concentração de movimento.
 *
 * O filete de latão se desenha ao longo das 6 etapas conforme a página rola, e
 * cada etapa acende ao entrar na viewport. A ideia é que a navegação diga a
 * mesma coisa que o texto: um percurso contínuo, com cuidado em cada parada.
 *
 * No touch, o acender é conduzido por `view()` — é ele que ocupa o lugar do
 * efeito de mouse. Em ponteiro fino, a luz do cursor entra por cima (`cartao-luz`).
 */
export function Processo({ dados }: { dados: Dados }) {
  if (!dados.mostrar) return null;

  return (
    <Secao
      id="processo"
      etiqueta="04"
      titulo={dados.titulo ?? "Como trabalhamos"}
      largura="ampla"
    >
      {dados.introducao && (
        <p className="mb-12 max-w-3xl text-lg leading-relaxed text-salvia" data-reveal>
          {dados.introducao}
        </p>
      )}

      <ol className="relative">
        {/* trilho + filete que se desenha */}
        <div
          aria-hidden
          className="absolute bottom-0 left-4 top-0 w-px bg-linha sm:left-6"
        >
          <div className="filete-processo h-full w-full bg-latao" />
        </div>

        {ETAPAS.map((etapa) => (
          <li
            key={etapa.numero}
            className="etapa-processo cartao-luz relative pb-12 pl-12 last:pb-0 sm:pl-16"
          >
            {/* luz conduzida pelo scroll: o driver que existe no celular */}
            <span
              aria-hidden
              className="etapa-luz pointer-events-none absolute inset-y-0 -left-4 -z-10 w-[min(28rem,90%)] bg-gradient-to-r from-latao/8 to-transparent"
            />

            <span
              aria-hidden
              className="numero absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-latao bg-fundo text-xs text-latao sm:h-12 sm:w-12 sm:text-sm"
            >
              {String(etapa.numero).padStart(2, "0")}
            </span>

            <h3 className="tipo-display text-secao leading-tight text-osso">
              {etapa.titulo}
            </h3>
            <p className="mt-3 max-w-2xl text-salvia">{etapa.descricao}</p>

            <dl className="mt-5 grid max-w-2xl gap-4 border-t border-linha pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-latao">
                  Você recebe
                </dt>
                <dd className="mt-1.5 text-osso">{etapa.entrega}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-salvia">
                  Sua parte
                </dt>
                <dd className="mt-1.5 text-salvia">{etapa.suaParte}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
