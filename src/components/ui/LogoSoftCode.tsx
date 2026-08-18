import Image from "next/image";

/**
 * Logo da SoftCode em cor original — o gradiente #1B63EC → #6E2ED0 conversa com
 * o azul de acento em vez de brigar, então não há motivo para descolorir a marca.
 *
 * O arquivo é uma lockup QUADRADA (viewBox 1024×1024, símbolo em cima e nome
 * embaixo): `w-auto` segue essa proporção 1:1, então altura pequena rende marca
 * minúscula. Por isso as alturas aqui são generosas.
 *
 * Em capítulo escuro entra a variante de fundo escuro, onde o "Soft" é claro —
 * a versão padrão tem o nome em navy e sumiria.
 */
export function LogoSoftCode({
  className = "h-12 w-auto",
  prioridade = false,
  escuro = false,
}: {
  className?: string;
  prioridade?: boolean;
  escuro?: boolean;
}) {
  return (
    <Image
      src={
        escuro
          ? "/Logos/500x500/SVG/SoftCode-Nome-Vetor-FundoEscuro.svg"
          : "/Logos/500x500/SVG/SoftCode-Nome-Vetor.svg"
      }
      alt="SoftCode"
      width={220}
      height={220}
      priority={prioridade}
      className={className}
    />
  );
}

/** Só o símbolo, para espaços estreitos. */
export function SimboloSoftCode({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/Logos/500x500/SVG/SoftCode-Simbolo-Vetor.svg"
      alt="SoftCode"
      width={64}
      height={64}
      className={className}
    />
  );
}
