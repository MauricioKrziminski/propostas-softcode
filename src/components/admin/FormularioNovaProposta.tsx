"use client";

import { useActionState } from "react";

import { novaProposta, type EstadoFormulario } from "@/app/admin/acoes";

const CAMPO =
  "min-h-12 w-full rounded-lg border border-linha bg-fundo px-4 text-base text-texto";

export function FormularioNovaProposta({ validadePadrao }: { validadePadrao: string }) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    novaProposta,
    {},
  );

  return (
    <form action={acao} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="empresa" className="text-sm text-texto">
          Empresa
        </label>
        <input id="empresa" name="empresa" required autoFocus className={CAMPO} />
        <p className="text-xs text-neblina">
          Vira o endereço da proposta e aparece em escala gigante na primeira dobra.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contato" className="text-sm text-texto">
          Pessoa de contato
        </label>
        <input id="contato" name="contato" required className={CAMPO} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-texto">
          E-mail do contato <span className="text-neblina">(opcional)</span>
        </label>
        <input id="email" name="email" type="email" className={CAMPO} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tituloProjeto" className="text-sm text-texto">
          Título do projeto
        </label>
        <input
          id="tituloProjeto"
          name="tituloProjeto"
          required
          placeholder="Site institucional"
          className={CAMPO}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="validaAte" className="text-sm text-texto">
          Válida até
        </label>
        <input
          id="validaAte"
          name="validaAte"
          type="date"
          required
          defaultValue={validadePadrao}
          className={CAMPO}
        />
        <p className="text-xs text-neblina">
          Depois desta data a proposta não some: ela abre no estado &ldquo;expirada&rdquo;, com
          convite para retomar a conversa.
        </p>
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm text-acento">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="min-h-12 rounded-lg bg-acento px-6 font-medium text-osso disabled:opacity-60"
      >
        {enviando ? "Criando..." : "Criar e editar"}
      </button>
    </form>
  );
}
