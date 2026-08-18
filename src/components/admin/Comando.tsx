"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A paleta de comando: `⌘K`.
 *
 * É o gesto padrão de ferramenta usada todo dia (Linear, Vercel, Raycast,
 * GitHub) e o motivo de existir aqui é prático: com quinze seções, uma lista e
 * meia dúzia de ações, achar as coisas com o mouse custa mais que digitar três
 * letras. Quem prefere o mouse não perde nada, porque tudo continua clicável.
 *
 * Sem biblioteca: são cem linhas, e uma dependência a mais custaria mais do que
 * economiza. O filtro é por SUBSEQUÊNCIA, não por prefixo, então "pgm" acha
 * "Programa de indicação".
 */
export type ItemDeComando = {
  id: string;
  rotulo: string;
  grupo: string;
  atalho?: string;
  executar: () => void;
};

function casa(termo: string, texto: string): boolean {
  if (!termo) return true;
  const alvo = texto.toLowerCase();
  let i = 0;
  for (const letra of termo.toLowerCase()) {
    i = alvo.indexOf(letra, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function Comando({ itens }: { itens: ItemDeComando[] }) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const focoAnterior = useRef<Element | null>(null);

  const filtrados = useMemo(
    () => itens.filter((i) => casa(termo, `${i.grupo} ${i.rotulo}`)),
    [itens, termo],
  );

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        focoAnterior.current = document.activeElement;
        setTermo("");
        setSelecionado(0);
        setAberto((v) => !v);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  useEffect(() => {
    if (aberto) campo.current?.focus();
    /* Ao fechar, o foco volta para onde estava. Sem isso, quem usa teclado
       cai no começo da página a cada vez que abre e desiste do atalho. */
    else (focoAnterior.current as HTMLElement | null)?.focus?.();
  }, [aberto]);

  if (!aberto) return null;

  function escolher(indice: number) {
    const item = filtrados[indice];
    if (!item) return;
    setAberto(false);
    item.executar();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comandos"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12dvh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setAberto(false);
      }}
    >
      <div className="painel-mesa w-full max-w-lg overflow-hidden bg-[var(--mesa-s1)]">
        <input
          ref={campo}
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setSelecionado(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelecionado((s) => Math.min(s + 1, filtrados.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelecionado((s) => Math.max(s - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              escolher(selecionado);
            }
          }}
          placeholder="Buscar seção ou ação"
          className="w-full border-0 border-b border-[var(--mesa-fio)] bg-transparent px-4 py-4 text-base text-[var(--mesa-tinta)] outline-none"
        />

        <ul className="max-h-[50dvh] overflow-y-auto py-1">
          {filtrados.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--mesa-tinta-apagada)]">
              Nada com esse nome.
            </li>
          )}

          {filtrados.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setSelecionado(i)}
                onClick={() => escolher(i)}
                className={`flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm ${
                  i === selecionado
                    ? "bg-[var(--mesa-s3)] text-[var(--mesa-tinta)]"
                    : "text-[var(--mesa-tinta-suave)]"
                }`}
              >
                <span className="etiqueta-mesa w-24 shrink-0 truncate">{item.grupo}</span>
                <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
                {item.atalho && <span className="tecla-mesa">{item.atalho}</span>}
              </button>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-3 border-t border-[var(--mesa-fio)] px-4 py-2">
          <span className="etiqueta-mesa">↑↓ navegar</span>
          <span className="etiqueta-mesa">↵ abrir</span>
          <span className="etiqueta-mesa">esc fechar</span>
        </p>
      </div>
    </div>
  );
}
