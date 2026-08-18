"use client";

import { motion, useReducedMotion, useTransform } from "motion/react";
import { LogoSoftCode } from "@/components/ui/LogoSoftCode";
import { useProgressoDaPagina } from "@/components/motion/percurso";

/**
 * Cabeçalho de vidro com barra de progresso de leitura.
 *
 * A barra é a única animação da página que também é INFORMAÇÃO: diz "este
 * documento tem tamanho conhecido e você está aqui". Num documento longo lido no
 * celular, isso segura quem desistiria no meio.
 *
 * Vem do `useScroll` (rAF), não de `scroll(root)` do CSS — a barra precisa
 * funcionar no iPhone do cliente, e `animation-timeline` só existe no iOS 26+.
 */
export function CabecalhoFixo({
  empresa,
  logoCliente,
}: {
  empresa: string;
  logoCliente?: string;
}) {
  const menosMovimento = useReducedMotion();
  const progresso = useProgressoDaPagina();

  // O cabeçalho só entra depois que o hero sai de cena. Vem de `useScroll`
  // (rAF) e não de `scroll(root)` do CSS — precisa aparecer no iPhone do
  // cliente, e `animation-timeline` não existe antes do iOS 26.
  //
  // Com reduced-motion ele nasce visível e fica: quem pediu menos movimento não
  // deveria depender de rolar a página para um elemento de navegação existir.
  const opacidade = useTransform(progresso, [0, 0.04, 0.07], [0, 0, 1]);

  return (
    <motion.div
      className="cabecalho-fixo vidro-sutil fixed inset-x-0 top-0 z-50 flex h-[var(--altura-cabecalho)] items-center justify-between gap-4 border-b border-linha bg-fundo/80 px-6 sm:px-8"
      style={menosMovimento ? undefined : { opacity: opacidade }}
    >
      <LogoCliente empresa={empresa} url={logoCliente} />
      <LogoSoftCode className="h-11 w-auto" />

      <motion.span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-acento"
        style={{ scaleX: progresso }}
      />
    </motion.div>
  );
}

/**
 * Logo do cliente, monocromático em navy por `mask-image` — a forma do arquivo
 * recorta uma área preenchida, então nenhum pixel da cor original passa. Logo
 * colorido de terceiro faria a proposta parecer documento de duas marcas mal
 * costuradas.
 */
function LogoCliente({ empresa, url }: { empresa: string; url?: string }) {
  if (!url) {
    return (
      <span className="tipo-display text-base tracking-tight">{empresa}</span>
    );
  }

  return (
    <span
      role="img"
      aria-label={empresa}
      className="block h-6 w-28 bg-navy"
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
