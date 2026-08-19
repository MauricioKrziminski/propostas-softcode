"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Convite } from "./Convite";
import { avisar } from "@/lib/eventos-cliente";

/**
 * Orquestra a passagem convite → proposta.
 *
 * São TRÊS fases, e não duas, por um motivo que só aparece assistindo: com duas
 * (aberto ou fechado), a proposta só começava a entrar depois de o convite sair
 * inteiro, e sobrava um quadro morto de tela branca no meio. As aberturas que
 * ganham prêmio nunca esperam a cortina terminar; elas sobrepõem. Aqui a fase
 * "passagem" é essa sobreposição: a proposta já está entrando POR BAIXO
 * enquanto a capa ainda está saindo por cima.
 *
 * Enquanto o convite está em cena, a proposta fica `inert` (sem foco, sem
 * leitura por leitor de tela) e o corpo não rola.
 */
type Fase = "convite" | "passagem" | "proposta";

/**
 * Quanto a abertura do envelope dura, do clique até a peça poder ser
 * desmontada. Precisa casar com a última animação de `.convite-saindo` no CSS
 * (hoje o `convite-sumir` do próprio `#convite`: 820ms de atraso mais 280ms).
 * Desmontar antes corta a animação no meio; depois deixa uma camada morta e
 * `pointer-events-none` por cima da proposta.
 */
const SAIDA_MS = 1100;

export function AberturaProposta({
  empresa,
  projeto,
  contato,
  validaAte,
  caminho,
  children,
  semConvite = false,
}: {
  empresa: string;
  projeto: string;
  /** A ficha do convite: para quem é, e até quando vale.
   */
  contato: string;
  validaAte: string;
  /** `{slug}-{token}`: é o que identifica a proposta no aviso por e-mail. */
  caminho: string;
  children: ReactNode;
  /** A prévia do painel entra por aqui: ela precisa da proposta, não da capa. */
  semConvite?: boolean;
}) {
  const [fase, setFase] = useState<Fase>(semConvite ? "proposta" : "convite");
  const propostaRef = useRef<HTMLDivElement>(null);
  const aberto = fase !== "convite";

  /* O link foi aberto. Não é a mesma coisa que ENTRAR na proposta, e por isso
     são dois avisos: um cliente que abre e não clica é informação de venda.
     A prévia do painel não conta, ela nem passa pelo convite. */
  useEffect(() => {
    if (semConvite) return;
    avisar(caminho, "convite_aberto");
  }, [caminho, semConvite]);

  useEffect(() => {
    if (fase === "proposta") return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [fase]);

  // Quando o convite sai, o foco iria parar no <body> e o próximo Tab começaria
  // do nada. Mandamos o foco para o início da proposta: é para onde a atenção
  // de quem usa teclado ou leitor de tela precisa ir.
  useEffect(() => {
    if (!aberto) return;
    propostaRef.current?.focus({ preventScroll: true });
  }, [aberto]);

  const abrir = () => {
    if (aberto) return;
    avisar(caminho, "proposta_aberta");
    setFase("passagem");
    const menos = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => setFase("proposta"), menos ? 0 : SAIDA_MS);
  };

  return (
    <>
      {fase !== "proposta" && (
        <Convite
          empresa={empresa}
          projeto={projeto}
          contato={contato}
          validaAte={validaAte}
          saindo={fase === "passagem"}
          aoAbrir={abrir}
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
