"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { formatarDataLonga, textoValidade } from "@/lib/proposta/formatar";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";
import { usePercurso } from "@/components/motion/percurso";

/**
 * HERO — capítulo noite, e a primeira dobra da proposta.
 *
 * Três camadas de parallax com FAIXAS diferentes, não só amplitudes diferentes:
 * faixas iguais leem como um plano só deslizando, por mais que as distâncias
 * variem. É a faixa que cria profundidade.
 *
 * O gesto assinatura — o nome do cliente encolhendo até dar lugar ao cabeçalho —
 * é conduzido por `useScroll`, e não por `scroll(root)` do CSS: é o efeito que o
 * cliente PRECISA ver, e `animation-timeline` não existe antes do iOS 26.
 *
 * O h1 é o LCP: nasce visível, sem animação de entrada, e nenhum eixo de fonte
 * variável é interpolado nele (isso reflui a linha a cada frame).
 */
export function Hero({
  empresa,
  cliente,
  projeto,
  emitidaEm,
  validaAte,
  expirada,
}: {
  empresa: string;
  cliente: string;
  projeto: string;
  emitidaEm: string;
  validaAte: string;
  expirada: boolean;
}) {
  const menosMovimento = useReducedMotion();
  const { alvo, progresso } = usePercurso(["start start", "end start"]);

  const escalaNome = useTransform(progresso, [0, 1], [1, 0.55]);
  const opacidadeNome = useTransform(progresso, [0, 0.75], [1, 0]);
  const subidaNome = useTransform(progresso, [0, 1], ["0%", "-14%"]);

  const camadaFundo = useTransform(progresso, [0, 1], ["0%", "34%"]);
  const camadaMeio = useTransform(progresso, [0, 1], ["0%", "18%"]);
  const camadaFrente = useTransform(progresso, [0, 1], ["0%", "-8%"]);

  return (
    <header
      ref={alvo}
      data-capitulo="noite"
      className="relative isolate flex min-h-[100dvh] flex-col justify-between overflow-hidden bg-noite px-6 pb-14 pt-6 sm:px-10"
    >
      {/* três camadas, três faixas — é a faixa que dá profundidade */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-1/3 -top-1/4 -z-10 h-[80dvh] w-[130vw] rounded-full bg-[radial-gradient(circle,var(--color-acento-noite)_0%,transparent_62%)] opacity-25 blur-3xl sm:w-[75vw]"
        style={menosMovimento ? undefined : { y: camadaFundo }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/3 -z-10 h-[60dvh] w-[110vw] rounded-full bg-[radial-gradient(circle,#6E2ED0_0%,transparent_65%)] opacity-20 blur-3xl sm:w-[55vw]"
        style={menosMovimento ? undefined : { y: camadaMeio }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-acento-noite to-transparent opacity-60"
        style={menosMovimento ? undefined : { y: camadaFrente }}
      />

      <div className="flex items-center justify-between gap-4">
        <LogoSoftCode className="h-20 w-auto sm:h-24" prioridade escuro />
        <span className="tipo-mono text-miudo uppercase tracking-[0.28em] text-noite-neblina">
          Proposta comercial
        </span>
      </div>

      <motion.div
        className="py-10"
        style={
          menosMovimento
            ? undefined
            : {
                scale: escalaNome,
                opacity: opacidadeNome,
                y: subidaNome,
                transformOrigin: "left top",
              }
        }
      >
        <p className="tipo-mono mb-6 text-miudo uppercase tracking-[0.32em] text-acento-noite">
          Proposta para
        </p>
        {/* LCP: nasce visível, sem animação de entrada */}
        <h1 className="tipo-display tipo-display-wonk text-nome !text-noite-texto">
          {empresa}
        </h1>
      </motion.div>

      <div className="grid gap-8 border-t border-noite-linha pt-8 sm:grid-cols-2">
        <div>
          <p className="tipo-mono text-miudo uppercase tracking-[0.28em] text-noite-neblina">
            Projeto
          </p>
          <p className="mt-3 text-destaque leading-snug text-noite-texto">{projeto}</p>
          <p className="mt-1 text-sm text-noite-neblina">Aos cuidados de {cliente}</p>
        </div>
        <dl className="grid grid-cols-2 gap-6 text-sm sm:justify-items-end sm:text-right">
          <div>
            <dt className="tipo-mono text-miudo uppercase tracking-[0.28em] text-noite-neblina">
              Emissão
            </dt>
            <dd className="numero mt-2 text-noite-texto">{formatarDataLonga(emitidaEm)}</dd>
          </div>
          <div>
            <dt className="tipo-mono text-miudo uppercase tracking-[0.28em] text-noite-neblina">
              Validade
            </dt>
            <dd className="numero mt-2 text-noite-texto">{formatarDataLonga(validaAte)}</dd>
            <dd
              className={`mt-1 text-xs ${expirada ? "text-noite-neblina" : "text-acento-noite"}`}
            >
              {textoValidade(validaAte)}
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
