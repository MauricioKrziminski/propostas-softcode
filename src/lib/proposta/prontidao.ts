import { CHAVES_SECAO, type ChaveSecao, type Proposta } from "./schema";

/**
 * O que ainda falta antes de mandar a proposta.
 *
 * Existe porque o erro caro deste produto não é errar uma vírgula: é enviar o
 * link com o escopo vazio, com o valor em zero, ou com validade já vencida. Isso
 * não aparece no painel a menos que alguém abra seção por seção conferindo, e
 * ninguém faz isso na sexta à noite.
 *
 * As regras vivem aqui, longe da tela, por dois motivos: dá para testá-las sem
 * navegador, e o e-mail de envio (que ainda vai existir) precisa exatamente das
 * mesmas para se recusar a mandar uma proposta pela metade.
 */
export type Pendencia = {
  id: string;
  texto: string;
  /** `impede` significa "não mande assim". `atencao` é ressalva, não bloqueio. */
  gravidade: "impede" | "atencao";
  /** Seção para onde o painel salta quando você clica na pendência. */
  secao?: ChaveSecao | "capa";
};

export type Prontidao = {
  pendencias: Pendencia[];
  /** Quantas verificações passaram, de quantas existem. */
  cumpridas: number;
  total: number;
  podeEnviar: boolean;
};

const SECOES_ESSENCIAIS: { chave: ChaveSecao; nome: string }[] = [
  { chave: "entendimento", nome: "O que entendemos" },
  { chave: "solucao", nome: "A solução proposta" },
  { chave: "escopo", nome: "Escopo detalhado" },
  { chave: "cronograma", nome: "Cronograma" },
  { chave: "investimento", nome: "Investimento" },
  { chave: "aceite", nome: "Aceite" },
];

export function avaliarProntidao(proposta: Proposta, hoje = new Date()): Prontidao {
  const pendencias: Pendencia[] = [];
  const { conteudo } = proposta;

  /* Uma verificação por seção essencial, mais as quatro de conteúdo abaixo. */
  let total = SECOES_ESSENCIAIS.length;

  for (const { chave, nome } of SECOES_ESSENCIAIS) {
    if (conteudo[chave] === undefined) {
      pendencias.push({
        id: `secao-${chave}`,
        texto: `${nome} está vazia`,
        gravidade: "impede",
        secao: chave,
      });
    }
  }

  /* Valor zerado: a proposta abre, mostra "R$ 0,00" e queima a conversa. */
  total += 1;
  const opcoes = conteudo.investimento?.opcoes ?? [];
  if (opcoes.length > 0 && opcoes.some((o) => o.valorCentavos === 0)) {
    pendencias.push({
      id: "valor-zerado",
      texto: "Alguma opção de investimento está com valor zerado",
      gravidade: "impede",
      secao: "investimento",
    });
  }

  /* Sem opção recomendada, a tabela de pagamento usa a primeira por falta de
     escolha, e o cliente perde a dica de qual formato faz mais sentido. */
  total += 1;
  if (opcoes.length > 1 && !opcoes.some((o) => o.destaque)) {
    pendencias.push({
      id: "sem-destaque",
      texto: "Nenhuma opção está marcada como recomendada",
      gravidade: "atencao",
      secao: "investimento",
    });
  }

  total += 1;
  const validade = new Date(`${proposta.validaAte}T12:00:00Z`);
  const diasRestantes = Math.round(
    (validade.getTime() - hoje.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diasRestantes < 0) {
    pendencias.push({
      id: "vencida",
      texto: "A validade já passou: a proposta abre no estado expirada",
      gravidade: "impede",
      secao: "capa",
    });
  } else if (diasRestantes <= 3) {
    pendencias.push({
      id: "vence-logo",
      texto: `A validade vence em ${diasRestantes} dia(s)`,
      gravidade: "atencao",
      secao: "capa",
    });
  }

  total += 1;
  if (proposta.status === "rascunho") {
    pendencias.push({
      id: "rascunho",
      texto: "Ainda é rascunho: só você consegue abrir o link",
      gravidade: "atencao",
      secao: "capa",
    });
  }

  const cumpridas = total - pendencias.length;
  return {
    pendencias,
    cumpridas: Math.max(0, cumpridas),
    total,
    podeEnviar: !pendencias.some((p) => p.gravidade === "impede"),
  };
}

/** Só para o painel: quantas seções a proposta tem, de quantas existem. */
export function contarSecoes(proposta: Proposta): { com: number; total: number } {
  const com = CHAVES_SECAO.filter((c) => proposta.conteudo[c] !== undefined).length;
  return { com, total: CHAVES_SECAO.length };
}
