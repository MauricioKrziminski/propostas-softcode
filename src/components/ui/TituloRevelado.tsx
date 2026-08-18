"use client";

import { Fragment } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * Título que se monta palavra a palavra, cada uma subindo de dentro do próprio
 * recorte com mola. Por TEMPO, não por scroll, ver o comentário em Revelar.tsx.
 */
const CONTAINER: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.055 } },
};

/** Repete a cada entrada, pelo mesmo critério de Revelar.tsx. */
const VIEWPORT = {
  once: false,
  amount: "some",
  margin: "0px 0px -10% 0px",
} as const;

const PALAVRA: Variants = {
  oculto: { y: "110%", rotate: 4 },
  visivel: {
    y: "0%",
    rotate: 0,
    transition: { type: "spring", stiffness: 110, damping: 20 },
  },
};

export function TituloRevelado({
  texto,
  className = "",
  como: Tag = "h2",
}: {
  texto: string;
  className?: string;
  como?: "h1" | "h2" | "h3";
}) {
  const menosMovimento = useReducedMotion();
  const palavras = texto.split(" ");

  if (menosMovimento) {
    return <Tag className={className}>{texto}</Tag>;
  }

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        variants={CONTAINER}
        initial="oculto"
        whileInView="visivel"
        viewport={VIEWPORT}
      >
        {/* O espaço fica FORA do `.palavra-clip`. Dentro dele, que é
            `inline-block` com `overflow: hidden`, o espaço final é descartado e
            as palavras grudam ("Oquevamosfazer"). */}
        {palavras.map((palavra, i) => (
          <Fragment key={i}>
            <span className="palavra-clip">
              <motion.span className="inline-block" variants={PALAVRA}>
                {palavra}
              </motion.span>
            </span>
            {i < palavras.length - 1 ? " " : null}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}
