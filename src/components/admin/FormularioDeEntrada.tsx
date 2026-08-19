"use client";

import { useActionState } from "react";

import { entrar, type EstadoFormulario } from "@/app/painel/acoes";

/**
 * O campo de senha e o erro.
 *
 * `useActionState` existe aqui por um motivo só: mostrar "senha incorreta" sem
 * perder a página. O envio continua sendo um `<form action=...>` de verdade, e
 * funciona com JavaScript desligado.
 */
export function FormularioDeEntrada() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form action={acao} className="mt-10 flex flex-col gap-3">
      <label htmlFor="senha" className="etiqueta-mesa">
        Senha
      </label>
      <input
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        className="campo-mesa min-h-12 font-mono tracking-[0.2em]"
      />

      {estado.erro && (
        <p role="alert" className="text-sm text-[var(--mesa-aviso)]">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="botao-mesa botao-mesa-forte mt-3 min-h-12 disabled:opacity-60"
      >
        {enviando ? "Conferindo..." : "Entrar"}
      </button>
    </form>
  );
}
