"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatarValor } from "@/lib/proposta/formatar";

/**
 * Odômetro: cada dígito é uma coluna 0–9 que sobe até parar no número certo.
 *
 * O valor final é renderizado no SERVIDOR e substituído no cliente, sem JS,
 * com reduced-motion, ou se o observer não disparar, o cliente lê o preço
 * correto de imediato. Animação nunca é pré-requisito para ler um valor.
 *
 * `tabular-nums` no container garante largura fixa por dígito: sem isso, a
 * coluna de preços dança enquanto conta, que é o defeito que mais denuncia
 * amadorismo numa proposta.
 */
/** Altura da caixa de cada caractere, em `em`. Vale para dígito e separador. */
const ALTURA_EM = 1.1;

export function Odometro({
  valorCentavos,
  className = "",
}: {
  valorCentavos: number;
  className?: string;
}) {
  const menosMovimento = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [rodar, setRodar] = useState(false);

  const texto = formatarValor(valorCentavos);

  useEffect(() => {
    const el = ref.current;
    if (!el || menosMovimento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setRodar(true);
          observador.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [menosMovimento]);

  if (menosMovimento) {
    return (
      <span className={`tipo-mono ${className}`} style={{ lineHeight: ALTURA_EM }}>
        {texto}
      </span>
    );
  }

  return (
    <span ref={ref} className={`tipo-mono inline-flex ${className}`} aria-label={texto}>
      {texto.split("").map((caractere, i) => (
        <Digito key={i} caractere={caractere} rodar={rodar} indice={i} />
      ))}
    </span>
  );
}



function Digito({
  caractere,
  rodar,
  indice,
}: {
  caractere: string;
  rodar: boolean;
  indice: number;
}) {
  const ehDigito = /\d/.test(caractere);

  /**
   * Separadores e o "R$" não rolam, só os algarismos. Mas eles PRECISAM ter a
   * mesma caixa dos dígitos.
   *
   * Sem a altura e a entrelinha abaixo, o separador herdava a entrelinha da
   * seção (1.65) enquanto o dígito usava a sua (1.1). Como todos são itens de
   * um flex alinhados pelo topo, o glifo do "." ficava centrado numa caixa mais
   * alta e aparecia ~12px abaixo dos números: o preço saía com o ponto caído e
   * os algarismos flutuando.
   */
  if (!ehDigito) {
    return (
      <span
        aria-hidden
        className={caractere === " " ? "w-[0.28em]" : undefined}
        style={{ height: `${ALTURA_EM}em`, lineHeight: `${ALTURA_EM}em` }}
      >
        {caractere === " " ? "" : caractere}
      </span>
    );
  }

  const alvo = Number(caractere);

  return (
    <span
      aria-hidden
      className="inline-block overflow-hidden"
      style={{ height: `${ALTURA_EM}em`, lineHeight: `${ALTURA_EM}em` }}
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: rodar ? `-${alvo * ALTURA_EM}em` : 0 }}
        transition={{
          type: "spring",
          stiffness: 60,
          damping: 16,
          delay: 0.05 * indice,
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} style={{ height: `${ALTURA_EM}em`, lineHeight: `${ALTURA_EM}em` }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
