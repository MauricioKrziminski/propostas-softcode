"use client";

import { useEffect, useState } from "react";

import { excluir } from "@/app/admin/acoes";

/**
 * Excluir de verdade, com um passo no meio.
 *
 * Não existe lixeira nem desfazer: a linha sai do banco e o link morre. Por isso
 * o botão pede confirmação, e por isso a confirmação é INLINE, com o nome da
 * empresa na frente, em vez de um `confirm()` do navegador. Caixa nativa é
 * genérica ("tem certeza?"), some no celular e não diz o que vai embora.
 *
 * A confirmação expira sozinha em seis segundos. Botão que fica armado
 * esperando um clique distraído é como se apaga a proposta errada.
 */
export function BotaoExcluir({
  id,
  empresa,
  largo,
}: {
  id: string;
  empresa: string;
  /** Na capa da proposta o botão ocupa a linha inteira; na lista, não. */
  largo?: boolean;
}) {
  const [armado, setArmado] = useState(false);

  useEffect(() => {
    if (!armado) return;
    const relogio = setTimeout(() => setArmado(false), 6000);
    return () => clearTimeout(relogio);
  }, [armado]);

  if (!armado) {
    return (
      <button
        type="button"
        onClick={() => setArmado(true)}
        className={`botao-mesa ${largo ? "w-full" : ""}`}
      >
        Excluir
      </button>
    );
  }

  return (
    <span
      className={`flex flex-wrap items-center gap-2 ${largo ? "w-full" : ""}`}
      role="alert"
    >
      <span className="text-sm text-[var(--mesa-aviso)]">
        Excluir {empresa} para sempre?
      </span>

      <form action={excluir}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="botao-mesa border-[var(--mesa-aviso)] text-[var(--mesa-aviso)]"
        >
          Sim, excluir
        </button>
      </form>

      <button type="button" onClick={() => setArmado(false)} className="botao-mesa">
        Cancelar
      </button>
    </span>
  );
}
