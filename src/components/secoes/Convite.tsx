"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * O convite: a primeira coisa que o cliente vê ao abrir o link do WhatsApp.
 *
 * O FORMATO DE ENVELOPE PERSISTE até ele clicar — antes a aba girava sozinha na
 * entrada e o formato se perdia em dois segundos, virando um cartão comum.
 * Agora o envelope fica fechado, respirando de leve, e só abre no clique: a aba
 * gira para trás, o cartão desliza para fora e a proposta entra.
 *
 * Fallbacks que sustentam isso:
 *   · SSR, então não há piscada da proposta antes do convite;
 *   · <noscript> o esconde — sem JS não haveria como fechá-lo;
 *   · `.so-tela` o remove da impressão;
 *   · com reduced-motion nada gira: o cartão já aparece pronto com o botão.
 */
export function Convite({
  empresa,
  projeto,
  aoAbrir,
}: {
  empresa: string;
  projeto: string;
  aoAbrir: () => void;
}) {
  const menosMovimento = useReducedMotion();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const [estado, setEstado] = useState<"fechado" | "abrindo">("fechado");

  const abrir = () => {
    if (estado === "abrindo") return;
    setEstado("abrindo");
    // a proposta só assume depois de a aba girar e o cartão sair
    window.setTimeout(aoAbrir, menosMovimento ? 0 : 1150);
  };

  useEffect(() => {
    const t = window.setTimeout(
      () => botaoRef.current?.focus(),
      menosMovimento ? 0 : 900,
    );
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") abrir();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", aoTeclar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <noscript>
        <style>{`#convite{display:none!important}`}</style>
      </noscript>

      <motion.div
        id="convite"
        role="dialog"
        aria-modal="true"
        aria-label={`Proposta para ${empresa}`}
        className="so-tela fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-fundo px-6"
        initial={false}
        animate={estado}
        variants={{
          fechado: {},
          abrindo: { opacity: 0, transition: { delay: 0.75, duration: 0.4 } },
        }}
      >
        <div
          aria-hidden
          className="convite-brilho pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--color-acento)_0%,transparent_65%)] opacity-40 blur-3xl"
        />

        <Envelope
          empresa={empresa}
          projeto={projeto}
          botaoRef={botaoRef}
          aoClicar={abrir}
          menosMovimento={!!menosMovimento}
        />
      </motion.div>
    </>
  );
}

function Envelope({
  empresa,
  projeto,
  botaoRef,
  aoClicar,
  menosMovimento,
}: {
  empresa: string;
  projeto: string;
  botaoRef: React.RefObject<HTMLButtonElement | null>;
  aoClicar: () => void;
  menosMovimento: boolean;
}) {
  const mola = { type: "spring", stiffness: 70, damping: 16 } as const;

  return (
    /* Raiz sem `animate` próprio: um `animate` aqui interromperia a propagação
       das variantes que vêm de #convite e a aba nunca receberia "abrindo".
       A entrada fica por conta do CSS (.convite-cartao), que o contexto de
       variantes atravessa sem problema. */
    <div
      className="convite-cartao relative w-full max-w-md"
      style={{ perspective: 1600 }}
    >
      {/* corpo do envelope */}
      <motion.div
        className="relative"
        variants={{
          fechado: { y: 0 },
          abrindo: { y: 8, transition: { duration: 0.3 } },
        }}
      >
        {/* o cartão: fica DENTRO do envelope e sobe ao abrir */}
        <motion.div
          className="relative z-10 overflow-hidden border border-linha bg-superficie px-7 pb-24 pt-28 text-center sm:px-10 sm:pb-28 sm:pt-32"
          variants={{
            fechado: { y: 0 },
            abrindo: menosMovimento
              ? {}
              : { y: -120, scale: 1.03, transition: { ...mola, delay: 0.45 } },
          }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-acento" />

          <p className="text-xs uppercase tracking-[0.28em] text-neblina">
            Proposta para
          </p>

          <p className="tipo-display mt-4 text-[clamp(2rem,10vw,3.25rem)] leading-[1.05] text-osso">
            {empresa}
          </p>

          <span aria-hidden className="mx-auto mt-6 block h-px w-14 bg-acento" />

          <p className="mt-6 text-sm leading-relaxed text-neblina">{projeto}</p>

          <button
            ref={botaoRef}
            type="button"
            onClick={aoClicar}
            className="alvo-toque mt-9 inline-flex items-center justify-center rounded-full bg-acento px-8 py-3.5 text-sm uppercase tracking-[0.14em] text-osso transition-colors duration-200 hover:bg-acento-claro motion-reduce:transition-none"
          >
            Abrir o convite
          </button>

          <p className="mt-5 text-xs text-neblina">
            SoftCode · leva cerca de 6 minutos
          </p>
        </motion.div>

        {/* aba do envelope: fechada até o clique, e é ela que define o formato */}
        {!menosMovimento && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 top-0 z-20 h-24 origin-top sm:h-28"
            style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
            variants={{
              fechado: { rotateX: 0 },
              abrindo: { rotateX: -172, transition: { duration: 0.75, ease: [0.6, 0, 0.2, 1] } },
            }}
          >
            <div className="h-full w-full bg-elevado [clip-path:polygon(0_0,100%_0,50%_100%)]" />
            <div
              className="absolute inset-x-0 top-0 h-full [clip-path:polygon(0_0,100%_0,50%_100%)]"
              style={{
                background:
                  "linear-gradient(180deg, rgb(61 59 243 / 0.28), transparent 60%)",
              }}
            />
          </motion.div>
        )}

        {/* bolso da frente do envelope, que faz o cartão parecer encaixado */}
        {!menosMovimento && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 border-x border-b border-linha bg-elevado [clip-path:polygon(0_38%,50%_0,100%_38%,100%_100%,0_100%)] sm:h-16"
          />
        )}
      </motion.div>
    </div>
  );
}
