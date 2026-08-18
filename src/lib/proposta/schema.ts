import { z } from "zod";

/**
 * FONTE DA VERDADE do conteúdo de uma proposta.
 *
 * Este arquivo governa três consumidores, e é por isso que ele existe antes de
 * qualquer componente:
 *   1. os componentes de seção, que recebem `z.infer` das fatias abaixo;
 *   2. a coluna `conteudo jsonb` do Postgres (Fase 2), validada na escrita e na leitura;
 *   3. o formulário estruturado da Fase 4, que vai ser gerado percorrendo estes
 *      schemas e lendo os `.describe()`.
 *
 * Por causa do item 3, TODO campo tem `.describe()` com o rótulo que apareceria
 * no formulário. Campo sem describe vira input sem label depois.
 */

/* ─────────────────────────── primitivos ─────────────────────────── */

const textoCurto = z.string().trim().min(1).max(200);
const textoMedio = z.string().trim().min(1).max(600);
const textoLongo = z.string().trim().min(1).max(2000);

/** Dinheiro é sempre inteiro em centavos. Nunca float, nunca string. */
const centavos = z
  .number()
  .int("Valor deve ser inteiro em centavos (R$ 1.500,00 = 150000)")
  .nonnegative();

/* ─────────────────────────── seções ─────────────────────────── */

export const entendimentoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  paragrafos: z
    .array(textoLongo)
    .min(1)
    .max(6)
    .describe("O problema do cliente, nas palavras dele"),
  citacaoCliente: z
    .strictObject({
      texto: textoMedio.describe("Frase dita pelo cliente"),
      autor: textoCurto.optional().describe("Quem disse"),
    })
    .optional()
    .describe("Citação literal: é o que prova que você ouviu"),
});

export const solucaoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  resumo: textoLongo.describe("O que vamos construir, em linguagem de negócio"),
  pilares: z
    .array(
      z.strictObject({
        titulo: textoCurto.describe("Nome do pilar"),
        descricao: textoMedio.describe("O que ele resolve"),
      }),
    )
    .min(2)
    .max(6)
    .describe("Pilares da solução"),
});

export const escopoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  introducao: textoMedio.optional().describe("Frase de abertura do escopo"),
  modulos: z
    .array(
      z.strictObject({
        titulo: textoCurto.describe("Nome do módulo"),
        resumo: textoMedio.describe("Resumo visível com o bloco fechado"),
        itens: z
          .array(textoMedio)
          .min(1)
          .max(20)
          .describe("O que está incluso neste módulo"),
        entregaveis: z
          .array(textoCurto)
          .max(10)
          .optional()
          .describe("Artefatos entregues ao final"),
      }),
    )
    .min(1)
    .max(12)
    .describe("Módulos/entregas em blocos expansíveis"),
});

export const processoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  introducao: textoMedio.optional().describe("Frase de abertura do processo"),
  mostrar: z
    .boolean()
    .default(true)
    .describe("Exibir as 6 etapas (o conteúdo é fixo, em processo.ts)"),
});

export const cronogramaSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  fases: z
    .array(
      z.strictObject({
        nome: textoCurto.describe("Nome da fase"),
        duracao: textoCurto.describe('Duração legível, ex.: "2 semanas"'),
        semanas: z
          .number()
          .int()
          .positive()
          .max(104)
          .describe("Duração em semanas, usada para a proporção da barra"),
        descricao: textoMedio.optional().describe("O que acontece nesta fase"),
      }),
    )
    .min(1)
    .max(12)
    .describe("Fases do projeto"),
  observacao: textoMedio.optional().describe("Ressalva sobre o cronograma"),
});

export const opcaoInvestimentoSchema = z.strictObject({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Use apenas minúsculas, números e hífen")
    .describe("Identificador estável: é o que fica gravado no aceite"),
  nome: textoCurto.describe('Nome da opção, ex.: "Completo"'),
  resumo: textoMedio.describe("Para quem esta opção faz sentido"),
  valorCentavos: centavos.describe("Valor total em centavos"),
  formaPagamento: textoCurto
    .optional()
    .describe('Ex.: "40% na assinatura, 60% na entrega"'),
  prazo: textoCurto.optional().describe('Prazo desta opção, ex.: "8 semanas"'),
  itens: z
    .array(textoMedio)
    .min(1)
    .max(15)
    .describe("O que está incluído nesta opção"),
  destaque: z
    .boolean()
    .default(false)
    .describe("Marca visual de opção recomendada"),
});

export const investimentoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  introducao: textoMedio.optional().describe("Frase de abertura"),
  opcoes: z
    .array(opcaoInvestimentoSchema)
    .min(1)
    .max(3)
    .describe("De 1 a 3 opções. O cliente escolhe QUAL, não SE"),
  observacoes: z
    .array(textoMedio)
    .max(5)
    .optional()
    .describe("Notas de rodapé do investimento"),
});

export const foraDoEscopoSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  itens: z
    .array(textoMedio)
    .min(1)
    .max(15)
    .describe("O que NÃO está incluído, explícito e sem rodeio"),
  nota: textoMedio
    .optional()
    .describe("Ex.: pode ser orçado à parte quando fizer sentido"),
});

export const responsabilidadesSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  introducao: textoMedio.optional().describe("Frase de abertura"),
  itens: z
    .array(
      z.strictObject({
        item: textoCurto.describe("O que o cliente precisa fornecer"),
        detalhe: textoMedio.optional().describe("Explicação, se necessário"),
      }),
    )
    .min(1)
    .max(12)
    .describe("O que depende do cliente para o projeto andar"),
  nota: textoMedio.optional().describe("Ressalva sobre prazos e dependências"),
});

export const sobreSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  texto: textoLongo.describe("Sobre a SoftCode"),
  cases: z
    .array(
      z.strictObject({
        cliente: textoCurto.describe("Nome do cliente"),
        segmento: textoCurto.describe("Segmento de atuação"),
        resultado: textoMedio.describe("Resultado mensurável, sem adjetivo"),
        url: z.url().optional().describe("Link do case, se público"),
      }),
    )
    .max(6)
    .optional()
    .describe("Cases"),
});

export const aceiteSchema = z.strictObject({
  titulo: textoCurto.optional().describe("Título da seção"),
  texto: textoMedio.optional().describe("Frase acima do botão de aceite"),
  mostrarPdf: z
    .boolean()
    .default(true)
    .describe("Exibir o botão de baixar em PDF"),
});

/* ─────────────────────────── documento ─────────────────────────── */

export const CHAVES_SECAO = [
  "entendimento",
  "solucao",
  "escopo",
  "processo",
  "cronograma",
  "investimento",
  "foraDoEscopo",
  "responsabilidades",
  "sobre",
  "aceite",
] as const;

export const chaveSecaoSchema = z.enum(CHAVES_SECAO);

/** Toda seção é opcional: ausente aqui = não renderiza na página. */
export const conteudoSchema = z.strictObject({
  ordem: z
    .array(chaveSecaoSchema)
    .optional()
    .describe("Ordem alternativa das seções; omitido usa a ordem canônica"),
  entendimento: entendimentoSchema.optional(),
  solucao: solucaoSchema.optional(),
  escopo: escopoSchema.optional(),
  processo: processoSchema.optional(),
  cronograma: cronogramaSchema.optional(),
  investimento: investimentoSchema.optional(),
  foraDoEscopo: foraDoEscopoSchema.optional(),
  responsabilidades: responsabilidadesSchema.optional(),
  sobre: sobreSchema.optional(),
  aceite: aceiteSchema.optional(),
});

export const STATUS_PROPOSTA = [
  "rascunho",
  "enviada",
  "aceita",
  "arquivada",
] as const;

/**
 * A proposta inteira. O formato bate 1:1 com a linha de `propostas` da Fase 2,
 * é por isso que o JSON do seed não vira trabalho jogado fora.
 */
export const propostaSchema = z
  .strictObject({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug em minúsculas separado por hífen")
      .min(2)
      .max(60)
      .describe("Parte legível da URL"),
    token: z
      .string()
      .length(10, "O token é nanoid(10), nunca sequencial e nunca derivado")
      .regex(/^[A-Za-z0-9_-]+$/)
      .describe("Parte secreta da URL. É ela que autoriza o acesso"),
    cliente: z.strictObject({
      nome: textoCurto.describe("Pessoa de contato"),
      empresa: textoCurto.describe("Empresa. Vai em escala gigante no hero"),
      email: z.email().optional().describe("E-mail do contato"),
      logoUrl: z
        .string()
        .trim()
        .min(1)
        .optional()
        .describe(
          "Logo do cliente (SVG/PNG). Renderizado monocromático em osso, via máscara. A cor não é customizável",
        ),
    }),
    tituloProjeto: textoCurto.describe("Nome do projeto"),
    status: z.enum(STATUS_PROPOSTA).default("rascunho").describe("Status"),
    emitidaEm: z.iso.date().describe("Data de emissão (AAAA-MM-DD)"),
    validaAte: z.iso.date().describe("Última data de validade (AAAA-MM-DD)"),
    conteudo: conteudoSchema,
  })
  .refine((p) => p.validaAte >= p.emitidaEm, {
    message: "A validade não pode ser anterior à emissão",
    path: ["validaAte"],
  });

/* ─────────────────────────── tipos ─────────────────────────── */

export type Proposta = z.infer<typeof propostaSchema>;
export type Conteudo = z.infer<typeof conteudoSchema>;
export type ChaveSecao = (typeof CHAVES_SECAO)[number];
export type Entendimento = z.infer<typeof entendimentoSchema>;
export type Solucao = z.infer<typeof solucaoSchema>;
export type Escopo = z.infer<typeof escopoSchema>;
export type Processo = z.infer<typeof processoSchema>;
export type Cronograma = z.infer<typeof cronogramaSchema>;
export type Investimento = z.infer<typeof investimentoSchema>;
export type OpcaoInvestimento = z.infer<typeof opcaoInvestimentoSchema>;
export type ForaDoEscopo = z.infer<typeof foraDoEscopoSchema>;
export type Responsabilidades = z.infer<typeof responsabilidadesSchema>;
export type Sobre = z.infer<typeof sobreSchema>;
export type Aceite = z.infer<typeof aceiteSchema>;

/** Caminho público completo: é a comparação exata que resolve a proposta. */
export function caminhoPublico(p: Pick<Proposta, "slug" | "token">): string {
  return `${p.slug}-${p.token}`;
}
