"use client";

import { useActionState } from "react";

import { entrar, type EstadoFormulario } from "@/app/admin/acoes";

/**
 * O campo de senha e o erro.
 *
 * `useActionState` existe aqui por um motivo só: mostrar "senha incorreta" sem
 * perder a página. O envio funciona com JavaScript desligado, porque continua
 * sendo um `<form action=...>` de verdade.
 */
export function FormularioDeEntrada() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form action={acao} className="mt-8 flex flex-col gap-3">
      <label htmlFor="senha" className="text-sm text-texto">
        Senha
      </label>
      <input
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        className="min-h-12 rounded-lg border border-linha bg-fundo px-4 text-base text-texto"
      />

      {estado.erro && (
        <p role="alert" className="text-sm text-acento">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 min-h-12 rounded-lg bg-acento px-6 font-medium text-osso disabled:opacity-60"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
