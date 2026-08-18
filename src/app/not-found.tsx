import { CONTATO } from "@/lib/contato";

/**
 * 404 genérico de propósito: a mensagem é idêntica para link inexistente,
 * token errado e proposta em rascunho. A resposta nunca confirma se um slug
 * existe: é a contrapartida de a URL ser a única autorização.
 */
export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-6 py-16 sm:px-8">
      <p className="numero mb-5 text-sm uppercase tracking-[0.2em] text-acento">404</p>

      <h1 className="tipo-display text-titulo">Não encontramos esta página</h1>

      <p className="mt-6 text-lg leading-relaxed text-neblina">
        O link pode ter sido copiado pela metade. Isso acontece bastante quando
        ele passa por aplicativo de mensagem. Confira se o endereço veio inteiro.
      </p>

      <p className="mt-4 text-neblina">
        Se estiver correto e ainda assim não abrir, responda a conversa em que
        você recebeu o link, ou escreva para{" "}
        <a
          href={`mailto:${CONTATO.email}`}
          className="text-acento underline underline-offset-4"
        >
          {CONTATO.email}
        </a>
        .
      </p>
    </main>
  );
}
