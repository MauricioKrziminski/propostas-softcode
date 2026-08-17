import type { ComponentProps, ReactNode } from "react";

/**
 * Os 44×44px mínimos são garantidos AQUI, no componente, e não em cada uso —
 * é a única forma de a regra não se perder na décima tela.
 */
const BASE =
  "alvo-toque inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 " +
  "text-sm uppercase tracking-[0.12em] transition-[background-color,color,border-color] " +
  "duration-200 motion-reduce:transition-none";

const VARIANTES = {
  solido: "bg-acento text-osso hover:bg-acento-claro",
  contorno: "border border-linha text-navy hover:border-acento hover:text-acento",
} as const;

type Props = {
  variante?: keyof typeof VARIANTES;
  children: ReactNode;
} & ComponentProps<"button">;

export function Botao({ variante = "solido", children, className = "", ...resto }: Props) {
  return (
    <button {...resto} className={`${BASE} ${VARIANTES[variante]} ${className}`}>
      {children}
    </button>
  );
}

export function BotaoLink({
  variante = "contorno",
  children,
  className = "",
  ...resto
}: { variante?: keyof typeof VARIANTES; children: ReactNode } & ComponentProps<"a">) {
  return (
    <a {...resto} className={`${BASE} ${VARIANTES[variante]} ${className}`}>
      {children}
    </a>
  );
}
