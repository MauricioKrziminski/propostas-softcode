import { BotaoLink } from "@/components/ui/Botao";
import { formatarDataLonga } from "@/lib/proposta/formatar";
import { linkWhatsApp, linkEmail } from "@/lib/contato";

/**
 * Proposta vencida NÃO dá 404.
 *
 * Um 404 aqui diria "você errou o link"; o que aconteceu foi outra coisa, e é
 * uma oportunidade comercial, não um erro. Renderiza a identificação da proposta
 * e um convite direto para retomar a conversa.
 */
export function Expirada({
  empresa,
  projeto,
  validaAte,
}: {
  empresa: string;
  projeto: string;
  validaAte: string;
}) {
  const mensagem = `Olá! Sou da ${empresa}. A proposta "${projeto}" expirou, mas ainda temos interesse — podemos retomar a conversa?`;

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
      <p className="mb-5 text-sm uppercase tracking-[0.2em] text-latao">
        Proposta expirada
      </p>

      <h1 className="tipo-display text-titulo">
        Esta proposta expirou — vamos conversar
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-salvia">
        A proposta de <span className="text-osso">{projeto}</span> para a{" "}
        <span className="text-osso">{empresa}</span> era válida até{" "}
        <span className="numero text-osso">{formatarDataLonga(validaAte)}</span>.
        Escopo e prazos continuam de pé; os valores precisam ser revistos para a
        data de hoje.
      </p>

      <p className="mt-4 text-salvia">
        Se ainda fizer sentido, é rápido preparar uma versão atualizada — em
        geral no mesmo dia.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <BotaoLink
          variante="solido"
          href={linkWhatsApp(mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
        >
          Retomar pelo WhatsApp
        </BotaoLink>
        <BotaoLink
          href={linkEmail(`Retomar proposta — ${empresa}`, mensagem)}
        >
          Retomar por e-mail
        </BotaoLink>
      </div>
    </main>
  );
}
