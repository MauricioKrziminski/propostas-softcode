/**
 * As 6 etapas do processo da SoftCode.
 *
 * Conteúdo FIXO, igual em toda proposta — por isso mora no código e não no JSON.
 * O que a proposta controla é só se a seção aparece (`processo.mostrar`).
 *
 * Esta é a seção que precisa comunicar cuidado em cada etapa: cada uma diz o que
 * acontece, o que o cliente recebe no fim, e o que se espera dele. É o "o que eu
 * recebo" que transforma processo em promessa verificável.
 */

export type Etapa = {
  numero: number;
  titulo: string;
  descricao: string;
  entrega: string;
  suaParte: string;
};

export const ETAPAS: readonly Etapa[] = [
  {
    numero: 1,
    titulo: "Primeiro contato e briefing",
    descricao:
      "Uma conversa para entender o problema antes de falar de solução. O que trava hoje, o que já foi tentado, o que precisa estar de pé primeiro.",
    entrega: "Resumo do briefing por escrito, para você conferir se eu entendi.",
    suaParte: "Uma hora de conversa e acesso a quem vive o problema.",
  },
  {
    numero: 2,
    titulo: "Análise e proposta",
    descricao:
      "Estudo do que existe, das integrações necessárias e dos riscos reais. É desta etapa que sai a página que você está lendo agora.",
    entrega: "Esta proposta: escopo, cronograma e investimento em opções.",
    suaParte: "Ler com calma e apontar o que ficou de fora.",
  },
  {
    numero: 3,
    titulo: "Planejamento e wireframe",
    descricao:
      "Antes de qualquer pixel, a estrutura: quais telas existem, o que cada uma resolve e por onde o usuário passa. Errar aqui é barato.",
    entrega: "Wireframes navegáveis e o mapa de telas do projeto.",
    suaParte: "Uma rodada de revisão sobre fluxo, não sobre estética.",
  },
  {
    numero: 4,
    titulo: "Design visual e revisão",
    descricao:
      "A identidade aplicada sobre a estrutura já aprovada. Ajustes acontecem aqui, no arquivo de design, onde mudar custa minutos.",
    entrega: "Telas finalizadas em alta fidelidade, desktop e celular.",
    suaParte: "Duas rodadas de ajuste. A terceira raramente é necessária.",
  },
  {
    numero: 5,
    titulo: "Desenvolvimento e testes",
    descricao:
      "Construção em entregas parciais, com ambiente de homologação no ar desde a primeira semana. Você acompanha o progresso, não recebe uma surpresa no fim.",
    entrega: "Ambiente de homologação atualizado e acesso para testar.",
    suaParte: "Testar o que for entregue e reportar o que destoar.",
  },
  {
    numero: 6,
    titulo: "Entrega e suporte pós-lançamento",
    descricao:
      "Publicação, transferência de acessos e acompanhamento. Projeto entregue é projeto que a sua equipe consegue operar sozinha.",
    entrega:
      "Sistema no ar, documentação de operação e 30 dias de suporte incluídos.",
    suaParte: "Uma sessão de passagem de bastão com quem vai operar.",
  },
] as const;
