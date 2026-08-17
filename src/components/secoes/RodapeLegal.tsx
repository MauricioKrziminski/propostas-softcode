import { CONTATO } from "@/lib/contato";
import { formatarDataCurta } from "@/lib/proposta/formatar";

/**
 * Transparência de dados sem banner: não há cookie, não há serviço de terceiro
 * e não há publicidade nesta página, então um banner de consentimento só
 * sugeriria um rastreamento comercial que não existe.
 *
 * Traz também o bloco `.print-only` com URL e validade — no papel, o leitor
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
    <footer className="mx-auto w-full max-w-6xl border-t border-linha px-6 py-12 sm:px-8">
      <div className="print-only mb-8 text-sm">
        <p className="numero">
          Proposta emitida em {formatarDataCurta(emitidaEm)} · válida até{" "}
          {formatarDataCurta(validaAte)}
        </p>
        <p className="numero mt-1">proposta.softcodedev.com.br/{caminho}</p>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <span
          className="tipo-display text-sm uppercase tracking-[0.12em]"
          style={{ fontVariationSettings: '"wght" 700, "wdth" 100' }}
        >
          SoftCode
        </span>
        <a
          href={CONTATO.site}
          rel="noopener noreferrer nofollow"
          referrerPolicy="no-referrer"
          target="_blank"
          className="alvo-toque text-sm text-salvia underline underline-offset-4 hover:text-latao"
        >
          softcodedev.com.br
        </a>
      </div>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-salvia">
        <strong className="text-osso">Sobre seus dados.</strong> Esta página
        registra quando foi aberta e por qual navegador, para que a SoftCode
        saiba acompanhar esta proposta no tempo certo. Se você aceitar, guardamos
        data, hora, IP e navegador como comprovação. Não usamos cookies e não há
        serviços de terceiros nesta página. Os registros de acesso são apagados
        após 180 dias. Para consultar ou excluir seus dados, escreva para{" "}
        <a
          href={`mailto:${CONTATO.emailDados}`}
          className="text-latao underline underline-offset-4"
        >
          {CONTATO.emailDados}
        </a>
        .
      </p>
    </footer>
  );
}
