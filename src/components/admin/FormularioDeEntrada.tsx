"use client";

import { useActionState, useState } from "react";

import { entrar, type EstadoFormulario } from "@/app/painel/acoes";

/**
 * O campo de senha e o erro.
 *
 * `useActionState` existe aqui por um motivo só: mostrar "senha incorreta" sem
 * perder a página. O envio continua sendo um `<form action=...>` de verdade, e
 * funciona com JavaScript desligado.
 *
 * O olho que revela a senha existe porque o campo é mascarado e a senha é longa:
 * sem ele, errar uma letra significa apagar tudo e digitar de novo, e no celular
 * isso acontece o tempo todo. Ele nasce fechado, revela só enquanto você quiser,
 * e é `type="button"` para não enviar o formulário sem querer.
 */
export function FormularioDeEntrada() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});
  const [visivel, setVisivel] = useState(false);

  return (
    <form action={acao} className="mt-10 flex flex-col gap-3">
      <label htmlFor="senha" className="etiqueta-mesa">
        Senha
      </label>

      <div className="relative">
        <input
          id="senha"
          name="senha"
          type={visivel ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          required
          /* Espaço à direita para o botão: sem ele a senha passa por baixo do
             olho e some justamente quando você quer conferir. */
          className="campo-mesa min-h-12 pr-14 font-mono tracking-[0.2em]"
        />

        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          title={visivel ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-[var(--mesa-tinta-apagada)] hover:text-[var(--mesa-tinta)]"
        >
          <Olho aberto={visivel} />
        </button>
      </div>

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

/**
 * O ícone, desenhado aqui mesmo.
 *
 * São doze linhas de SVG contra uma biblioteca inteira de ícones para usar um
 * só. `aria-hidden` porque quem anuncia o botão é o `aria-label` dele: o ícone
 * repetido viraria leitura dupla.
 */
function Olho({ aberto }: { aberto: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M2.2 12S6 5.5 12 5.5 21.8 12 21.8 12 18 18.5 12 18.5 2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="3.1" />
      {!aberto && <path d="M4 20 20 4" />}
    </svg>
  );
}
