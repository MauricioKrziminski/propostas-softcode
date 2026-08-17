"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * Título que se monta palavra a palavra, cada uma subindo de dentro do próprio
 * recorte com mola. Por TEMPO, não por scroll — ver o comentário em Revelar.tsx.
 */
const CONTAINER: Variants = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.055 } },
};

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
        viewport={{ once: true, amount: 0.4 }}
      >
        {palavras.map((palavra, i) => (
          <span key={i} className="palavra-clip">
            <motion.span className="inline-block" variants={PALAVRA}>
              {palavra}
            </motion.span>
            {i < palavras.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
