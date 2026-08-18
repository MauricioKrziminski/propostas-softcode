"use client";

import { useState } from "react";

/**
 * Copiar o link é a ação mais repetida do painel: é o que vai para o WhatsApp do
 * cliente. Por isso ela confirma visualmente, senão não dá para saber se pegou.
 */
export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiou, setCopiou] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiou(true);
          setTimeout(() => setCopiou(false), 2000);
        } catch {
          /* Navegador sem permissão de área de transferência (acontece em
             contexto não seguro). O link continua visível em "Abrir". */
        }
      }}
      className="botao-mesa"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          copiou ? "bg-[var(--mesa-ok)]" : "bg-[var(--mesa-fio-forte)]"
        }`}
      />
      {copiou ? "Copiado" : "Copiar link"}
    </button>
  );
}
