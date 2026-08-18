"use client";

import { useState } from "react";

import type { ChaveSecao } from "@/lib/proposta/schema";
import { SECOES } from "./secoes";

/**
 * O trilho: as seções na ordem em que o cliente vai ler.
 *
 * Ele resolve três coisas que a pilha de acordeões não resolvia: dá para ver
 * TODAS as seções de uma vez, dá para saber quais faltam sem abrir nenhuma, e a
 * ordem finalmente pode ser mudada. O campo `conteudo.ordem` existe no schema
 * desde o começo e a página sempre respeitou, mas até aqui não havia como mexer
 * nele sem editar JSON na mão.
 *
 * Arrastar é enfeite de desktop. Quem manda de verdade são os botões de subir e
 * descer: funcionam no toque, funcionam no teclado, e são o mesmo gesto que o
 * `Repetidor` já usa dentro das seções.
 */
export type EstadoDaSecao = "preenchida" | "falta" | "fora";

const CORES: Record<EstadoDaSecao, string> = {
  preenchida: "bg-[var(--mesa-ok)]",
  falta: "bg-[var(--mesa-aviso)]",
  fora: "bg-[var(--mesa-fio-forte)]",
};

const TITULOS: Record<EstadoDaSecao, string> = {
  preenchida: "preenchida",
  falta: "falta preencher",
  fora: "fora da proposta",
};

export function TrilhoDeSecoes({
  ordem,
  estados,
  sujas,
  ativa,
  aoEscolher,
  aoReordenar,
}: {
  ordem: ChaveSecao[];
  estados: Record<string, EstadoDaSecao>;
  sujas: Set<string>;
  ativa: string;
  aoEscolher: (chave: string) => void;
  aoReordenar: (nova: ChaveSecao[]) => void;
}) {
  const [arrastando, setArrastando] = useState<number | null>(null);

  function mover(indice: number, passo: number) {
    const destino = indice + passo;
    if (destino < 0 || destino >= ordem.length) return;
    const copia = [...ordem];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    aoReordenar(copia);
  }

  function soltarEm(destino: number) {
    if (arrastando === null || arrastando === destino) return;
    const copia = [...ordem];
    const [movida] = copia.splice(arrastando, 1);
    copia.splice(destino, 0, movida);
    setArrastando(null);
    aoReordenar(copia);
  }

  return (
    <nav
      aria-label="Seções da proposta"
      className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0"
    >
      <ItemDoTrilho
        rotulo="Cliente e datas"
        numero="00"
        ativa={ativa === "capa"}
        aoEscolher={() => aoEscolher("capa")}
        suja={sujas.has("capa")}
      />

      {ordem.map((chave, i) => (
        <ItemDoTrilho
          key={chave}
          rotulo={SECOES[chave].rotulo}
          numero={String(i + 1).padStart(2, "0")}
          ativa={ativa === chave}
          estado={estados[chave] ?? "fora"}
          suja={sujas.has(chave)}
          aoEscolher={() => aoEscolher(chave)}
          aoSubir={i > 0 ? () => mover(i, -1) : undefined}
          aoDescer={i < ordem.length - 1 ? () => mover(i, 1) : undefined}
          arrastavel
          aoComecarArrasto={() => setArrastando(i)}
          aoSoltar={() => soltarEm(i)}
          sendoArrastada={arrastando === i}
        />
      ))}
    </nav>
  );
}

function ItemDoTrilho({
  rotulo,
  numero,
  ativa,
  estado,
  suja,
  aoEscolher,
  aoSubir,
  aoDescer,
  arrastavel,
  aoComecarArrasto,
  aoSoltar,
  sendoArrastada,
}: {
  rotulo: string;
  numero: string;
  ativa: boolean;
  estado?: EstadoDaSecao;
  suja: boolean;
  aoEscolher: () => void;
  aoSubir?: () => void;
  aoDescer?: () => void;
  arrastavel?: boolean;
  aoComecarArrasto?: () => void;
  aoSoltar?: () => void;
  sendoArrastada?: boolean;
}) {
  return (
    <div
      draggable={arrastavel}
      onDragStart={aoComecarArrasto}
      onDragOver={(e) => e.preventDefault()}
      onDrop={aoSoltar}
      className={`group flex shrink-0 items-center gap-2 border-[var(--mesa-fio)] lg:w-full lg:border-b ${
        sendoArrastada ? "opacity-40" : ""
      } ${ativa ? "bg-[var(--mesa-s2)]" : ""}`}
    >
      <button
        type="button"
        onClick={aoEscolher}
        aria-current={ativa ? "true" : undefined}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
      >
        <span
          aria-hidden
          className={`etiqueta-mesa shrink-0 ${ativa ? "text-[var(--mesa-acento)]" : ""}`}
        >
          {numero}
        </span>

        <span
          className={`truncate text-sm ${
            ativa ? "text-[var(--mesa-tinta)]" : "text-[var(--mesa-tinta-suave)]"
          }`}
        >
          {rotulo}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {suja && (
            <span
              title="alterações não salvas"
              className="h-1.5 w-1.5 rounded-full bg-[var(--mesa-acento)]"
            />
          )}
          {estado && (
            <span
              title={TITULOS[estado]}
              className={`h-1.5 w-1.5 rounded-full ${CORES[estado]}`}
            />
          )}
        </span>
      </button>

      {(aoSubir || aoDescer) && (
        <span
          className={`shrink-0 gap-0.5 pr-2 ${ativa ? "flex" : "hidden lg:flex"} lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100`}
        >
          <button
            type="button"
            onClick={aoSubir}
            disabled={!aoSubir}
            aria-label={`Subir ${rotulo}`}
            className="flex h-11 w-8 items-center justify-center text-[var(--mesa-tinta-apagada)] hover:text-[var(--mesa-acento)] disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={aoDescer}
            disabled={!aoDescer}
            aria-label={`Descer ${rotulo}`}
            className="flex h-11 w-8 items-center justify-center text-[var(--mesa-tinta-apagada)] hover:text-[var(--mesa-acento)] disabled:opacity-30"
          >
            ↓
          </button>
        </span>
      )}
    </div>
  );
}
