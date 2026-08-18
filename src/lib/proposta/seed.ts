import "server-only";

import { propostaSchema, caminhoPublico, type Proposta } from "./schema";
import barbaLog from "@/seed/barba-log.json";

/**
 * Fonte de dados da Fase 1: JSON versionado no repositório, validado pelo MESMO
 * schema que a coluna `conteudo jsonb` vai usar na Fase 2.
 *
 * Quando o banco entrar, só este arquivo é substituído, schema, componentes e
 * rota continuam iguais. É o que torna o seed descartável sem ser desperdício.
 */

const BRUTOS: unknown[] = [barbaLog];

/**
 * Valida na carga, e não no uso. Um JSON malformado quebra o build/dev na hora,
 * com o caminho do campo errado, em vez de virar `undefined` no meio de uma
 * seção depois que a proposta já foi enviada para o cliente.
 */
const PROPOSTAS: Proposta[] = BRUTOS.map((bruto, i) => {
  const resultado = propostaSchema.safeParse(bruto);
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((p) => `  · ${p.path.join(".") || "(raiz)"}: ${p.message}`)
      .join("\n");
    throw new Error(
      `Seed inválido (item ${i} de src/seed):\n${detalhes}\n` +
        `Corrija o JSON: ele precisa passar no mesmo schema que o banco usa.`,
    );
  }
  return resultado.data;
});

const POR_CAMINHO = new Map(PROPOSTAS.map((p) => [caminhoPublico(p), p]));

/**
 * Resolve pelo caminho completo `{slug}-{token}`, comparação exata.
 * O slug sozinho não resolve nada: é a mesma garantia do índice único da Fase 2.
 */
export function buscarPropostaPorCaminho(caminho: string): Proposta | null {
  return POR_CAMINHO.get(caminho) ?? null;
}

/** Só para gerar rotas estáticas em dev/build. Não existe rota que liste isto. */
export function todosOsCaminhos(): string[] {
  return [...POR_CAMINHO.keys()];
}
