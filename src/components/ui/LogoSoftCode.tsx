import Image from "next/image";

/**
 * Logo da SoftCode em cor original.
 *
 * Antes ele entrava monocromático via `mask-image`, o que fazia sentido sobre o
 * fundo escuro. Com o fundo branco da paleta do PDF, o gradiente original
 * (#1B63EC → #6E2ED0) conversa com o azul de acento em vez de brigar — então
 * não há motivo para descolorir a marca.
 *
 * `next/image` com o SVG: sem reprocessamento, e o tamanho vem do `className`.
 */
export function LogoSoftCode({
  className = "h-9 w-auto",
  prioridade = false,
}: {
  className?: string;
  prioridade?: boolean;
}) {
  return (
    <Image
      src="/Logos/500x500/SVG/SoftCode-Nome-Vetor.svg"
      alt="SoftCode"
      width={220}
      height={56}
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
