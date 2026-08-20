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
    /* O rodapé é FIXO, no sentido literal: ele ocupa a faixa de baixo da janela
       o tempo todo, por cima de tudo, desde a primeira dobra. Não sobe, não é
       descoberto, não faz gesto nenhum. Foi decisão do Gabriel depois de ver as
       duas alternativas.

       `z-40` o põe acima dos capítulos (que são `z-0`) e abaixo do cabeçalho
       fixo (`z-50`), do grão (`z-60`) e do convite (`z-100`).

       Isso só funciona porque `.proposta-entrando` deixou de reter `transform`:
       ancestral com transform, mesmo a identidade, vira bloco contêiner de todo
       `position: fixed` descendente, e o "fixo" passa a rolar junto com a
       página. Ver a nota do `backwards` em `globals.css`.

       E como ele cobre a faixa de baixo, essa faixa deixa de ser área de
       leitura: quem compensa é a cortina, que crava a base do capítulo no TOPO
       do rodapé (`useAlturaDoRodape`). Sem isso, a última fatia de cada
       capítulo ficaria escondida atrás dele.

       `bg-fundo` na casca, e de LARGURA INTEIRA: com o fundo na faixa de
       leitura (`max-w-6xl`) sobrariam duas tiras do capítulo escuro nas
       laterais. */
    <footer className="fixed inset-x-0 bottom-0 z-40 bg-fundo">
      <div className="mx-auto w-full max-w-6xl border-t border-linha px-6 py-4 sm:px-8">
        <div className="print-only mb-6 text-sm">
          <p className="numero">
            Proposta emitida em {formatarDataCurta(emitidaEm)} · válida até{" "}
            {formatarDataCurta(validaAte)}
          </p>
          <p className="numero mt-1">proposta.softcodedev.com.br/{caminho}</p>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <LogoSoftCode className="h-10 w-auto" />
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

        {/* Dentro de um `<details>` porque o rodapé agora é FIXO: aberto, este
            parágrafo tomava 216px num telefone de 664, ou seja, um terço da tela
            ocupado por texto legal durante a leitura inteira. Fechado, a barra cai
            para uns 90px e o texto continua presente, a um toque e no DOM. A
            impressão abre todo `<details>` (`PreparaImpressao` mais o reset do
            `print.css`), então no PDF ele sai inteiro. */}
        <details className="mt-2 max-w-3xl">
          <summary className="alvo-toque cursor-pointer text-[0.6875rem] text-neblina underline underline-offset-4 hover:text-acento">
            Sobre seus dados
          </summary>
          <p className="mt-2 max-w-3xl text-[0.6875rem] leading-snug text-neblina">
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
        </details>
      </div>
    </footer>
  );
}
