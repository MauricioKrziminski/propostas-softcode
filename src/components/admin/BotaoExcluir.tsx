"use client";

import { useRef } from "react";

import { excluir } from "@/app/admin/acoes";

/**
 * Excluir, com modal de confirmação.
 *
 * O `<dialog>` é nativo de propósito: ele já traz o que uma modal precisa ter e
 * que quase toda modal caseira erra, ou seja, foco preso dentro dela, `Esc`
 * fechando, fundo inerte e leitura correta por leitor de tela. Escrever isso na
 * mão seria mais código para chegar em menos.
 *
 * O texto nomeia a empresa e diz o que se perde. Não existe lixeira nem
 * desfazer: a linha sai do banco e o link que está no WhatsApp do cliente para
 * de abrir.
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
  const modal = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => modal.current?.showModal()}
        className={`botao-mesa ${largo ? "w-full" : ""}`}
      >
        Excluir
      </button>

      <dialog
        ref={modal}
        aria-labelledby={`excluir-titulo-${id}`}
        className="painel-mesa mesa m-auto w-[min(92vw,26rem)] p-0 text-[var(--mesa-tinta)] backdrop:bg-black/70"
      >
        <div className="p-6">
          <p className="etiqueta-mesa">excluir proposta</p>

          <h2
            id={`excluir-titulo-${id}`}
            className="titulo-mesa mt-3 text-[1.75rem] text-[var(--mesa-tinta)]"
          >
            {empresa}
          </h2>

          <p className="mt-4 leading-relaxed text-[var(--mesa-tinta-suave)]">
            A proposta sai do banco e o link que o cliente tem para de abrir. Não há
            desfazer.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
            {/* `method="dialog"` fecha sem enviar nada: é o cancelamento que o
                próprio elemento oferece, sem estado nenhum para manter. */}
            <form method="dialog">
              <button type="submit" className="botao-mesa">
                Cancelar
              </button>
            </form>

            <form action={excluir}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="botao-mesa border-[var(--mesa-aviso)] text-[var(--mesa-aviso)]"
              >
                Excluir para sempre
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
