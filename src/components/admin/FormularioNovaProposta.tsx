"use client";

import { useActionState } from "react";

import { novaProposta, type EstadoFormulario } from "@/app/painel/acoes";

/**
 * Cinco campos, e nada além.
 *
 * Tudo que se repete de proposta em proposta já entra pronto pelo modelo, então
 * esta tela pergunta só o que muda de cliente para cliente. Formulário curto na
 * criação é o que faz a proposta nascer em trinta segundos em vez de meia hora.
 */
function Campo({
  id,
  rotulo,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="etiqueta-mesa">
        {rotulo}
      </label>
      {children}
      {dica && (
        <p className="text-sm leading-relaxed text-[var(--mesa-tinta-apagada)]">{dica}</p>
      )}
    </div>
  );
}

export function FormularioNovaProposta({ validadePadrao }: { validadePadrao: string }) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    novaProposta,
    {},
  );

  return (
    <form action={acao} className="mt-10 flex flex-col gap-7">
      <Campo
        id="empresa"
        rotulo="Empresa"
        dica="Vira o endereço da proposta e aparece em escala gigante na primeira dobra."
      >
        <input id="empresa" name="empresa" required autoFocus className="campo-mesa" />
      </Campo>

      <Campo id="contato" rotulo="Pessoa de contato">
        <input id="contato" name="contato" required className="campo-mesa" />
      </Campo>

      <Campo id="email" rotulo="E-mail do contato (opcional)">
        <input id="email" name="email" type="email" className="campo-mesa" />
      </Campo>

      <Campo id="tituloProjeto" rotulo="Título do projeto">
        <input
          id="tituloProjeto"
          name="tituloProjeto"
          required
          placeholder="Site institucional"
          className="campo-mesa"
        />
      </Campo>

      <Campo
        id="validaAte"
        rotulo="Válida até"
        dica="Depois desta data a proposta não some: ela abre no estado expirada, com convite para retomar a conversa."
      >
        <input
          id="validaAte"
          name="validaAte"
          type="date"
          required
          defaultValue={validadePadrao}
          className="campo-mesa font-mono"
        />
      </Campo>

      {estado.erro && (
        <p role="alert" className="text-sm text-[var(--mesa-aviso)]">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="botao-mesa botao-mesa-forte min-h-12 disabled:opacity-60"
      >
        {enviando ? "Criando..." : "Criar e abrir na mesa"}
      </button>
    </form>
  );
}
