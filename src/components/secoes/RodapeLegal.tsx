import { CONTATO } from "@/lib/contato";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";
import { formatarDataCurta } from "@/lib/proposta/formatar";

/**
 * Transparência de dados sem banner: não há cookie, não há serviço de terceiro
 * e não há publicidade nesta página, então um banner de consentimento só
 * sugeriria um rastreamento comercial que não existe.
 *
 * Traz também o bloco `.print-only` com URL e validade, no papel, o leitor
 * precisa saber de onde o documento veio. Margin box de @page não renderiza
 * conteúdo em navegador, então isso é um elemento real no DOM.
 */
export function RodapeLegal({
  caminho,
  validaAte,
  emitidaEm,
}: {
  caminho: string;
  validaAte: string;
  emitidaEm: string;
}) {
  return (
    /* Duas coisas nesta casca, e as duas por causa da cortina:

       `relative z-0`, senão o último capítulo, congelado, pinta POR CIMA do
       rodapé (ele é posicionado e o rodapé em fluxo não).

       `bg-fundo`, e essa é a que faltava: pintando por cima, um rodapé
       TRANSPARENTE deixa o capítulo escuro congelado aparecer atrás dele, e
       todo o texto do rodapé, que é de tema claro, some no escuro. O fundo
       precisa ser de LARGURA INTEIRA, por isso ele mora aqui e a faixa de
       leitura (`max-w-6xl`) virou um filho: com o fundo na caixa de 6xl,
       sobrariam duas faixas escuras nas laterais. */
    <footer className="relative z-0 bg-fundo">
      <div className="mx-auto w-full max-w-6xl border-t border-linha px-6 py-12 sm:px-8">
        <div className="print-only mb-8 text-sm">
          <p className="numero">
            Proposta emitida em {formatarDataCurta(emitidaEm)} · válida até{" "}
            {formatarDataCurta(validaAte)}
          </p>
          <p className="numero mt-1">proposta.softcodedev.com.br/{caminho}</p>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <LogoSoftCode className="h-20 w-auto" />
          <a
            href={CONTATO.site}
            rel="noopener noreferrer nofollow"
            referrerPolicy="no-referrer"
            target="_blank"
            className="alvo-toque text-sm text-neblina underline underline-offset-4 hover:text-acento"
          >
            softcodedev.com.br
          </a>
        </div>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-neblina">
          <strong className="text-navy">Sobre seus dados.</strong> Esta página
          registra quando foi aberta e por qual navegador, para que a SoftCode
          saiba acompanhar esta proposta no tempo certo. Se você aceitar, guardamos
          data, hora, IP e navegador como comprovação. Não usamos cookies e não há
          serviços de terceiros nesta página. Os registros de acesso são apagados
          após 180 dias. Para consultar ou excluir seus dados, escreva para{" "}
          <a
            href={`mailto:${CONTATO.emailDados}`}
            className="text-acento underline underline-offset-4"
          >
            {CONTATO.emailDados}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
