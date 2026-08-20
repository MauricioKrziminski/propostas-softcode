import { CONTATO, linkWhatsApp } from "@/lib/contato";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";
import { formatarDataCurta, formatarDataLonga } from "@/lib/proposta/formatar";

/** O endereço público das propostas. PLURAL: o singular não resolve. */
const DOMINIO = "propostas.softcodedev.com.br";

/** Etiqueta de coluna, no mesmo registro das etiquetas de seção. */
const ROTULO =
  "tipo-mono text-[0.6875rem] uppercase tracking-[0.28em] text-neblina";

/** Link de rodapé: discreto, sublinhado só o suficiente para ser link. */
/* `alvo-toque` já reserva os 44px de alvo, então o ritmo da lista vem dele e
   não de um `space-y`: somando os dois, a coluna de canais ficava com o dobro
   do respiro do resto do rodapé e lia como se estivesse solta. `inline-flex`
   com `items-center` é o que faz o texto ficar no meio desses 44px em vez de
   grudado no topo. */
const LINK =
  "alvo-toque inline-flex items-center text-sm text-texto underline decoration-linha-azul " +
  "underline-offset-4 transition-colors duration-200 hover:text-acento " +
  "hover:decoration-acento motion-reduce:transition-none";

const CONVERSA =
  "Olá! Estou vendo a proposta da SoftCode e queria falar com vocês.";

/**
 * O fecho do documento, e a última seção da proposta.
 *
 * Ele é seção COMUM: fluxo normal depois do aceite, sem cortina, sem grudar e
 * sem gesto nenhum. Depois de uma leitura inteira com movimento, o rodapé é
 * onde a página para de se mexer.
 *
 * Três colunas, e cada uma responde uma pergunta que sobra no fim: quem fez
 * isto, por onde eu falo com eles, e o que é este documento que estou olhando.
 * A terceira é `so-tela` porque no papel a mesma informação já sai no bloco
 * `.print-only` logo acima, em formato de documento.
 *
 * Transparência de dados sem banner: não há cookie, não há serviço de terceiro
 * e não há publicidade nesta página, então um banner de consentimento só
 * sugeriria um rastreamento comercial que não existe.
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
    /* `relative z-0` e `bg-fundo` não são efeito, são seguro barato: os
       capítulos são posicionados em `z-0`, então um rodapé em fluxo puro
       pintaria atrás deles se um dia voltassem a se sobrepor, e transparente
       ele deixaria o escuro aparecer por trás do texto de tema claro. O fundo
       mora na casca porque na faixa de leitura sobrariam tiras nas laterais. */
    <footer className="relative z-0 bg-fundo">
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
        <div className="print-only mb-8 text-sm">
          <p className="numero">
            Proposta emitida em {formatarDataCurta(emitidaEm)} · válida até{" "}
            {formatarDataCurta(validaAte)}
          </p>
          <p className="numero mt-1">
            {DOMINIO}/{caminho}
          </p>
        </div>

        <div className="grid gap-9 border-t border-linha pt-10 pb-10 sm:grid-cols-3 sm:gap-10 sm:pt-14 sm:pb-12">
          <div>
            {/* A margem negativa não é ajuste fino gratuito: o SVG é uma lockup
                QUADRADA e o desenho ocupa só 66% dela, com uns 17% de folga de
                cada lado. Sem puxar, a marca fica visivelmente recuada em
                relação a tudo que vem embaixo, e é isso que lê como
                desalinhado. 17,4% de 7rem dá 1,22rem. */}
            <LogoSoftCode className="-ml-[1.22rem] h-28 w-auto" />
            <p className="mt-1 max-w-[30ch] text-sm leading-relaxed text-neblina">
              Sites e sistemas sob medida, feitos por quem escreve o código.
            </p>
          </div>

          <div>
            <p className={ROTULO}>Falar com a gente</p>
            <ul className="mt-3">
              {CONTATO.whatsapps.map((pessoa) => (
                <li key={pessoa.numero}>
                  <a
                    href={linkWhatsApp(CONVERSA, pessoa.numero)}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className={LINK}
                  >
                    WhatsApp {pessoa.nome}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={CONTATO.instagram}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  referrerPolicy="no-referrer"
                  className={LINK}
                >
                  Instagram
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTATO.email}`} className={LINK}>
                  {CONTATO.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTATO.site}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  referrerPolicy="no-referrer"
                  className={LINK}
                >
                  {DOMINIO.replace("propostas.", "")}
                </a>
              </li>
            </ul>
          </div>

          {/* No papel esta coluna sairia repetindo o bloco `.print-only` acima,
              que já diz a mesma coisa em formato de documento. */}
          <div className="so-tela">
            <p className={ROTULO}>Este documento</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-neblina">Emissão</dt>
                <dd className="numero mt-0.5 text-texto">{formatarDataLonga(emitidaEm)}</dd>
              </div>
              <div>
                <dt className="text-neblina">Validade</dt>
                <dd className="numero mt-0.5 text-texto">{formatarDataLonga(validaAte)}</dd>
              </div>
              <div>
                <dt className="text-neblina">Endereço</dt>
                <dd className="numero mt-0.5 break-words text-texto">
                  {DOMINIO}/{caminho}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="border-t border-linha py-7">
          <p className="max-w-4xl text-xs leading-relaxed text-neblina">
            <strong className="font-medium text-navy">Sobre seus dados.</strong>{" "}
            Esta página registra quando foi aberta e por qual navegador, para que
            a SoftCode saiba acompanhar esta proposta no tempo certo. Se você
            aceitar, guardamos data, hora, IP e navegador como comprovação. Não
            usamos cookies e não há serviços de terceiros nesta página. Os
            registros de acesso são apagados após 180 dias. Para consultar ou
            excluir seus dados, escreva para{" "}
            <a
              href={`mailto:${CONTATO.emailDados}`}
              className="text-acento underline underline-offset-4"
            >
              {CONTATO.emailDados}
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
