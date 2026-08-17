import { CONTATO } from "@/lib/contato";

/**
 * Raiz institucional mínima. ZERO links para propostas — não existe listagem
 * neste site, e esta página não pode virar a porta dos fundos de uma.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-6 py-16 sm:px-8">
      <p className="mb-5 text-sm uppercase tracking-[0.2em] text-latao">SoftCode</p>

      <h1 className="tipo-display text-titulo">Propostas comerciais</h1>

      <p className="mt-6 text-lg leading-relaxed text-salvia">
        Este endereço hospeda propostas individuais. Cada cliente recebe um link
        próprio, enviado diretamente por nós — não há listagem pública nem busca.
      </p>

      <p className="mt-4 text-salvia">
        Se você recebeu um link e ele não abre, responda a mesma conversa em que
        recebeu, ou escreva para{" "}
        <a
          href={`mailto:${CONTATO.email}`}
          className="text-latao underline underline-offset-4"
        >
          {CONTATO.email}
        </a>
        .
      </p>

      <a
        href={CONTATO.site}
        target="_blank"
        rel="noopener noreferrer nofollow"
        referrerPolicy="no-referrer"
        className="alvo-toque mt-10 inline-flex w-fit items-center text-sm uppercase tracking-[0.12em] text-osso underline underline-offset-4 hover:text-latao"
      >
        Conheça a SoftCode
      </a>
    </main>
  );
}
