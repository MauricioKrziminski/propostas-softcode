import type { Conteudo } from "./schema";

/**
 * O ALICERCE de uma proposta nova.
 *
 * Todo orçamento da SoftCode repete os mesmos blocos: dois meses de suporte,
 * entrada de 25% com 75% na entrega, a regra de cancelamento, o programa de
 * indicação, os custos que ficam de fora e o texto sobre a empresa. Redigitar
 * isso a cada cliente é onde nascem as versões divergentes, e foi o que motivou
 * o painel.
 *
 * Duas decisões que valem ser explícitas:
 *
 *   1. É CÓPIA, não referência. O que este arquivo devolve é gravado dentro da
 *      proposta no momento da criação. Mudar o texto aqui não reescreve nenhuma
 *      proposta que já existe, e ajustar uma proposta no painel não vaza para as
 *      outras. Proposta enviada é documento comercial: ela não pode mudar de
 *      texto sozinha depois que o cliente leu.
 *
 *   2. Só entra o que é MESMO repetido. Entendimento, solução, escopo e
 *      cronograma ficam de fora de propósito: são o que muda em cada cliente, e
 *      texto de exemplo ali é o tipo de coisa que acaba indo para o cliente sem
 *      ninguém notar. O painel mostra essas seções como pendentes.
 */
export function modeloDeConteudo({ empresa }: { empresa: string; tituloProjeto?: string }): Conteudo {
  return {
    processo: {
      mostrar: true,
      introducao:
        "Seis etapas, do briefing à entrega. Você sabe o que recebe e o que precisa aprovar em cada uma.",
    },

    responsabilidades: {
      titulo: "O que precisamos de você",
      introducao:
        "O projeto anda no ritmo em que esses itens chegam. Quanto antes, melhor. E nada disso precisa estar pronto na assinatura.",
      itens: [
        { item: "Logotipo em boa qualidade", detalhe: "De preferência em vetor (SVG, AI ou PDF)." },
        {
          item: "Fotos",
          detalhe:
            "Da equipe, da estrutura e dos produtos. Se não houver fotos boas, vale organizar uma sessão antes de começarmos: é o que mais pesa na aparência final do site.",
        },
        {
          item: "Informações da empresa",
          detalhe: "História, estrutura, diferenciais e o que a empresa atende.",
        },
        {
          item: "Textos das páginas",
          detalhe: "Estruturamos e revisamos, mas o conteúdo técnico vem de vocês.",
        },
        {
          item: "Acesso ao domínio",
          detalhe: "Para configurarmos o endereço quando o site subir.",
        },
        {
          item: "Uma reunião de escopo no início e retorno nas aprovações",
          detalhe: "É o que mantém o cronograma de pé.",
        },
      ],
      nota: "Atraso no envio do material desloca a entrega no mesmo tanto, porque as etapas dependem dele.",
    },

    suporte: {
      titulo: "Suporte após a entrega",
      introducao:
        "Depois que o site estiver no ar, a SoftCode acompanha por 2 meses sem custo adicional. Se aparecer algum erro ou algo não funcionar como combinado, corrigimos dentro desse período.",
      itens: [
        "Correção de qualquer erro de funcionamento do site.",
        "Suporte para dúvidas sobre o site.",
        "Uma revisão de conteúdo antes da publicação.",
      ],
      nota: "Passados os 2 meses, manutenções e ajustes são orçados conforme o tamanho e a complexidade do pedido. Novas páginas e funcionalidades seguem a mesma lógica: são avaliadas e orçadas separadamente, sempre com o valor aprovado antes de qualquer execução.",
    },

    investimento: {
      titulo: "Investimento",
      introducao: `Duas opções para que a ${empresa} escolha o que faz mais sentido. As duas incluem o mesmo site, as mesmas páginas e os mesmos cuidados técnicos. A diferença está no acabamento visual.`,
      opcoes: [
        {
          id: "com-animacoes",
          nome: "Com animações",
          resumo:
            "Visual mais moderno, com efeitos ao rolar a página e transições suaves entre as seções.",
          valorCentavos: 0,
          prazo: "8 semanas",
          formaPagamento: "25% de entrada na aprovação e 75% na entrega",
          itens: [
            "Todas as páginas combinadas no escopo",
            "Animações em textos e componentes",
            "Efeitos ao rolar a página e transições suaves",
            "2 meses de suporte após a entrega",
          ],
          destaque: true,
        },
        {
          id: "sem-animacoes",
          nome: "Sem animações",
          resumo: "Layout limpo e direto, com carregamento mais rápido, mantendo o tom profissional.",
          valorCentavos: 0,
          prazo: "8 semanas",
          formaPagamento: "25% de entrada na aprovação e 75% na entrega",
          itens: [
            "Todas as páginas combinadas no escopo",
            "Layout limpo, sem efeitos ao rolar",
            "Carregamento mais rápido",
            "2 meses de suporte após a entrega",
          ],
          destaque: false,
        },
      ],
      observacoes: ["Valores válidos até a data de validade desta proposta."],
    },

    pagamento: {
      titulo: "Como o pagamento funciona",
      introducao:
        "O pagamento é dividido em duas partes: uma entrada para dar início ao projeto e o restante somente quando o site estiver pronto, testado e aprovado.",
      parcelas: [
        { rotulo: "Entrada, ao aprovar a proposta", percentual: 25 },
        { rotulo: "Pagamento final, com o site entregue e aprovado", percentual: 75 },
      ],
      nota: "Os valores da tabela seguem a opção recomendada. Para as outras, valem os mesmos percentuais sobre o valor escolhido.",
      cancelamento: {
        titulo: "Se o projeto precisar ser cancelado",
        texto: `Se por algum motivo a ${empresa} precisar cancelar o projeto após o início dos trabalhos, a entrada paga não será reembolsada, pois cobre o tempo e os recursos já dedicados. Como o pagamento final só acontece na entrega completa, não haverá nenhuma cobrança adicional além da entrada já realizada.`,
      },
    },

    custosRecorrentes: {
      titulo: "Custos que não estão no valor acima",
      texto:
        "O site é construído sobre uma infraestrutura que, no volume de acessos de um site institucional, opera dentro do plano gratuito. Não há previsão de mensalidade de hospedagem.",
      itens: [
        {
          item: "Renovação anual do domínio",
          detalhe: `Fica por conta da ${empresa}, pago direto ao registrador.`,
        },
      ],
    },

    foraDoEscopo: {
      titulo: "Fora do escopo",
      itens: [
        "Painel administrativo ou CMS para edição de conteúdo",
        "Produção dos textos das páginas (copywriting)",
        "Produção de fotos ou criação de identidade visual",
        "Hospedagem e domínio",
        "Gestão de campanhas de anúncio",
      ],
      nota: "Nada disso é impossível, só não está incluído nos valores acima. Qualquer um destes itens pode ser orçado à parte quando fizer sentido.",
    },

    indicacao: {
      titulo: "Programa de indicação",
      percentual: 10,
      texto: `Como agrado a quem confia no nosso trabalho, a ${empresa} passa a fazer parte do programa de indicação da SoftCode. Se indicar alguém e essa pessoa ou empresa fechar um projeto conosco, vocês recebem 10% do valor do primeiro projeto fechado por indicação de vocês. O valor é pago assim que o projeto indicado for quitado. Não há custo nem obrigação nenhuma para participar.`,
    },

    sobre: {
      titulo: "Sobre a SoftCode",
      texto:
        "A SoftCode é uma software house brasileira que constrói sites e sistemas sob medida para empresas de médio porte. Trabalhamos com times pequenos e contato direto: você fala com quem escreve o código, não com um intermediário.",
    },

    finais: {
      titulo: "Considerações finais",
      paragrafos: [
        `Esta proposta foi elaborada a partir da conversa inicial e da análise do que a ${empresa} tem hoje. A ideia é entregar algo à altura da empresa: um site que apresente a companhia com solidez e transforme visita em pedido de orçamento.`,
        "Qualquer dúvida, ajuste ou pedido de esclarecimento, estamos à disposição.",
      ],
      contato: "SoftCode · softcodedv@gmail.com",
    },

    aceite: {
      titulo: "Aceite",
      texto:
        "Se fizer sentido, escolha o formato que se encaixa e confirme abaixo. A partir daí preparamos o contrato e marcamos o início do planejamento.",
      mostrarPdf: true,
    },
  };
}

/** As seções que o modelo NÃO preenche, porque mudam a cada cliente. */
export const SECOES_DO_CLIENTE = [
  "entendimento",
  "solucao",
  "escopo",
  "cronograma",
] as const;
