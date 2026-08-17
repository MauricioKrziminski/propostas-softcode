"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Convite } from "./Convite";

/**
 * Orquestra a passagem convite → proposta.
 *
 * Enquanto o convite está em cena, a proposta fica `inert` (sem foco, sem
 * leitura por leitor de tela) e o corpo não rola. Ao abrir, o convite sai em
 * escala e a proposta entra — as duas animações se sobrepõem, então a passagem
 * parece uma coisa só e não dois estados piscando.
 */
export function AberturaProposta({
  empresa,
  projeto,
  children,
}: {
  empresa: string;
  projeto: string;
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const propostaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  // Quando o convite sai, o foco iria parar no <body> e o próximo Tab começaria
  // do nada. Mandamos o foco para o início da proposta — é para onde a atenção
  // de quem usa teclado ou leitor de tela precisa ir.
  useEffect(() => {
    if (!aberto) return;
    propostaRef.current?.focus({ preventScroll: true });
  }, [aberto]);

  return (
    <>
      {!aberto && (
        <Convite
          empresa={empresa}
          projeto={projeto}
          aoAbrir={() => setAberto(true)}
        />
      )}
      <div
        ref={propostaRef}
        tabIndex={-1}
        inert={!aberto}
        className={`outline-none ${aberto ? "proposta-entrando" : ""}`}
      >
        {children}
      </div>
    </>
  );
}
