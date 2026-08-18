import { Secao } from "@/components/ui/Secao";
import { rotulo } from "@/lib/proposta/formatar";
import { Revelar, ListaRevelada, ItemRevelado } from "@/components/motion/Revelar";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";
import type { Sobre as Dados } from "@/lib/proposta/schema";

/**
 * Sobre a SoftCode e os cases.
 *
 * O case é apresentado com o RESULTADO em destaque tipográfico e o nome do
 * cliente como legenda, a ordem inversa da usual, e proposital: quem lê uma
 * proposta quer saber o que aconteceu, não de quem é a logo.
 */
export function Sobre({ dados, numero }: { dados: Dados; numero: number }) {
  return (
    <Secao
      id="sobre"
      etiqueta={rotulo(numero)}
      titulo={dados.titulo ?? "Sobre a SoftCode"}
      largura="ampla"
    >
      <div className="grid gap-12 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-16">
        <Revelar
          como="p"
          className="max-w-2xl text-destaque leading-relaxed text-[var(--ctx-texto)]"
        >
          {dados.texto}
        </Revelar>
        <Revelar direcao="escala" className="shrink-0">
          <LogoSoftCode className="h-24 w-auto sm:h-28" />
        </Revelar>
      </div>

      {dados.cases && dados.cases.length > 0 && (
        <ListaRevelada className="mt-16 grid gap-4 sm:grid-cols-3">
          {dados.cases.map((caso) => (
            <ItemRevelado
              key={caso.cliente}
              como="article"
              className="case-item cartao-luz varredura relative flex flex-col overflow-hidden rounded-[var(--radius-peca)] border border-[var(--ctx-linha)] bg-[var(--ctx-fundo)] p-7"
            >
              <p className="flex-1 text-[var(--ctx-titulo)]">{caso.resultado}</p>

              <div className="mt-7 border-t border-[var(--ctx-linha)] pt-5">
                <p className="tipo-display text-[1.0625rem] leading-tight">
                  {caso.cliente}
                </p>
                <p className="tipo-mono mt-1 text-miudo uppercase tracking-[0.2em] text-[var(--ctx-neblina)]">
                  {caso.segmento}
                </p>
                {caso.url && (
                  <a
                    href={caso.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    referrerPolicy="no-referrer"
                    className="alvo-toque mt-3 inline-flex items-center text-sm text-[var(--ctx-acento)] underline underline-offset-4"
                  >
                    Ver o case
                  </a>
                )}
              </div>
            </ItemRevelado>
          ))}
        </ListaRevelada>
      )}
    </Secao>
  );
}
