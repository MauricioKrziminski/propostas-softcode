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
    /* O rodapé NÃO participa da cortina: ele não sobe por cima de ninguém, ele
       fica PARADO e é descoberto quando o último capítulo termina de rolar. É
       outro gesto de propósito, e é o que fecha a leitura: a proposta acaba e
       embaixo dela sempre esteve o rodapé.

       `sticky bottom-0` e não `fixed`: assim ele continua no fluxo, a altura
       dele entra na altura do documento e não é preciso reservar espaço na mão.
       Grudado embaixo, ele fica encostado no rodapé da tela desde o começo,
       escondido atrás dos capítulos, e aparece sem se mexer um pixel.

       `-z-10` é o que o deixa ATRÁS: os capítulos são posicionados em `z-0`, e
       z negativo pinta abaixo deles (e abaixo do `<main>` em fluxo) sem sair do
       contexto de empilhamento da proposta.

       `bg-fundo` na casca, e de LARGURA INTEIRA: com o fundo na faixa de
       leitura (`max-w-6xl`) sobrariam duas tiras do capítulo escuro nas
       laterais. */
    <footer className="sticky bottom-0 -z-10 bg-fundo">
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
