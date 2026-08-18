"use client";

import type { ReactNode } from "react";

/**
 * Os tijolos do editor.
 *
 * O formulário NÃO é gerado automaticamente do Zod, e isso é escolha, não
 * preguiça: o que o schema descreve bem é o formato, não a ergonomia. Lista de
 * módulos precisa de reordenar, duplicar e remover; valor precisa de máscara de
 * dinheiro; percentual precisa somar 100 na cara do usuário. Um gerador
 * entregaria quinze telas iguais e nenhuma boa.
 *
 * O que vem do schema é a validação (no servidor, antes de gravar) e os rótulos
 * dos `.describe()`, copiados para cá como texto de apoio.
 */

const CAMPO = "campo-mesa";
const BOTAO_MIUDO = "botao-mesa min-w-11 px-2";

function Rotulo({ children, dica }: { children: ReactNode; dica?: string }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="etiqueta-mesa">{children}</span>
      {dica && (
        <span className="text-xs leading-relaxed text-[var(--mesa-tinta-apagada)]">{dica}</span>
      )}
    </span>
  );
}

export function CampoTexto({
  rotulo,
  valor,
  aoMudar,
  dica,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  dica?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>
      <input
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className={CAMPO}
      />
    </label>
  );
}

export function CampoArea({
  rotulo,
  valor,
  aoMudar,
  dica,
  linhas = 4,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  dica?: string;
  linhas?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>
      <textarea
        value={valor}
        rows={linhas}
        onChange={(e) => aoMudar(e.target.value)}
        className={`${CAMPO} min-h-24 leading-relaxed`}
      />
    </label>
  );
}

export function CampoNumero({
  rotulo,
  valor,
  aoMudar,
  dica,
  min,
  max,
  sufixo,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  dica?: string;
  min?: number;
  max?: number;
  sufixo?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={Number.isFinite(valor) ? valor : ""}
          min={min}
          max={max}
          onChange={(e) => aoMudar(Number(e.target.value))}
          className={`${CAMPO} font-mono`}
        />
        {sufixo && <span className="etiqueta-mesa">{sufixo}</span>}
      </span>
    </label>
  );
}

/**
 * Dinheiro entra como as pessoas digitam e sai como o banco guarda: inteiro em
 * centavos. Digitar "1.800,00" e gravar 180000 é o contrato; float não aparece
 * em ponto nenhum do caminho.
 */
export function CampoDinheiro({
  rotulo,
  centavos,
  aoMudar,
  dica,
}: {
  rotulo: string;
  centavos: number;
  aoMudar: (v: number) => void;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica ?? "Digite só os números. R$ 1.800,00 vira 180000 centavos."}>
        {rotulo}
      </Rotulo>
      <span className="flex items-center gap-2">
        <span className="etiqueta-mesa">R$</span>
        <input
          inputMode="decimal"
          value={(centavos / 100).toFixed(2).replace(".", ",")}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, "");
            aoMudar(digitos ? Number(digitos) : 0);
          }}
          className={`${CAMPO} font-mono`}
        />
      </span>
    </label>
  );
}

export function CampoData({
  rotulo,
  valor,
  aoMudar,
  dica,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>
      <input
        type="date"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className={CAMPO}
      />
    </label>
  );
}

export function CampoBooleano({
  rotulo,
  valor,
  aoMudar,
  dica,
}: {
  rotulo: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
  dica?: string;
}) {
  return (
    <label className="flex min-h-11 items-start gap-3">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => aoMudar(e.target.checked)}
        className="mt-0.5 h-5 w-5 accent-[var(--mesa-acento)]"
      />
      <Rotulo dica={dica}>{rotulo}</Rotulo>
    </label>
  );
}

export function CampoSelecao({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  dica,
}: {
  rotulo: string;
  valor: string;
  opcoes: readonly string[];
  aoMudar: (v: string) => void;
  dica?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)} className={CAMPO}>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Lista de frases: os itens de escopo, os tópicos de suporte, os parágrafos. */
export function ListaDeTextos({
  rotulo,
  valores,
  aoMudar,
  dica,
  multilinha,
  rotuloAdicionar = "Adicionar item",
}: {
  rotulo: string;
  valores: string[];
  aoMudar: (v: string[]) => void;
  dica?: string;
  multilinha?: boolean;
  rotuloAdicionar?: string;
}) {
  const trocar = (i: number, v: string) =>
    aoMudar(valores.map((atual, j) => (i === j ? v : atual)));
  const mover = (i: number, passo: number) => {
    const destino = i + passo;
    if (destino < 0 || destino >= valores.length) return;
    const copia = [...valores];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    aoMudar(copia);
  };

  return (
    <div className="flex flex-col gap-2">
      <Rotulo dica={dica}>{rotulo}</Rotulo>

      {valores.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          {multilinha ? (
            <textarea
              value={v}
              rows={3}
              onChange={(e) => trocar(i, e.target.value)}
              className={`${CAMPO} min-h-24 leading-relaxed`}
            />
          ) : (
            <input value={v} onChange={(e) => trocar(i, e.target.value)} className={CAMPO} />
          )}
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => mover(i, -1)} className={BOTAO_MIUDO} title="Subir">
              ↑
            </button>
            <button type="button" onClick={() => mover(i, 1)} className={BOTAO_MIUDO} title="Descer">
              ↓
            </button>
            <button
              type="button"
              onClick={() => aoMudar(valores.filter((_, j) => j !== i))}
              className={BOTAO_MIUDO}
              title="Remover"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => aoMudar([...valores, ""])}
        className="botao-mesa w-fit border-dashed"
      >
        {rotuloAdicionar}
      </button>
    </div>
  );
}

/** Lista de objetos: módulos, fases, opções de investimento, parcelas. */
export function Repetidor<T>({
  rotulo,
  itens,
  aoMudar,
  novoItem,
  rotuloAdicionar = "Adicionar",
  children,
  dica,
}: {
  rotulo: string;
  itens: T[];
  aoMudar: (v: T[]) => void;
  /* `NoInfer` obriga o tipo a vir de `itens`, não daqui. Sem ele o TypeScript
     inferia T do objeto devolvido por `novoItem`, que é o item mais pobre
     possível (só os campos obrigatórios), e todo campo opcional passava a
     acusar erro dentro do repetidor. */
  novoItem: () => NoInfer<T>;
  rotuloAdicionar?: string;
  dica?: string;
  children: (item: T, atualizar: (v: T) => void, indice: number) => ReactNode;
}) {
  const mover = (i: number, passo: number) => {
    const destino = i + passo;
    if (destino < 0 || destino >= itens.length) return;
    const copia = [...itens];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    aoMudar(copia);
  };

  return (
    <div className="flex flex-col gap-3">
      <Rotulo dica={dica}>{rotulo}</Rotulo>

      {itens.map((item, i) => (
        <div key={i} className="rounded-xl border border-[var(--mesa-fio)] bg-[var(--mesa-s2)] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="etiqueta-mesa">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={() => mover(i, -1)} className={BOTAO_MIUDO} title="Subir">
                ↑
              </button>
              <button type="button" onClick={() => mover(i, 1)} className={BOTAO_MIUDO} title="Descer">
                ↓
              </button>
              <button
                type="button"
                onClick={() => aoMudar(itens.filter((_, j) => j !== i))}
                className={BOTAO_MIUDO}
                title="Remover"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {children(item, (v) => aoMudar(itens.map((a, j) => (i === j ? v : a))), i)}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => aoMudar([...itens, novoItem()])}
        className="botao-mesa w-fit border-dashed"
      >
        {rotuloAdicionar}
      </button>
    </div>
  );
}
