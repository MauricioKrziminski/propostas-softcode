"use client";

import type { ReactNode } from "react";

import {
  CampoArea,
  CampoBooleano,
  CampoDinheiro,
  CampoNumero,
  CampoTexto,
  ListaDeTextos,
  Repetidor,
} from "./campos";
import type {
  ChaveSecao,
  Conteudo,
  Cronograma,
  CustosRecorrentes,
  Entendimento,
  Escopo,
  Finais,
  ForaDoEscopo,
  Indicacao,
  Investimento,
  Pagamento,
  Processo,
  Responsabilidades,
  Sobre,
  Solucao,
  Suporte,
  Aceite,
} from "@/lib/proposta/schema";

/**
 * Um editor por seção, e o registro que a página do painel percorre.
 *
 * Os campos opcionais moram no estado como string vazia, porque input
 * controlado não aceita `undefined` sem virar não controlado no meio da
 * digitação. `podar()` limpa isso na hora de salvar: sem ela, um título vazio
 * chegaria como "" e o Zod recusaria com "String must contain at least 1
 * character" num campo que a pessoa deixou em branco de propósito.
 */
export function podar<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor
      .map((v) => podar(v))
      .filter((v) => v !== undefined && v !== "") as unknown as T;
  }
  if (valor && typeof valor === "object") {
    const saida: Record<string, unknown> = {};
    for (const [chave, bruto] of Object.entries(valor as Record<string, unknown>)) {
      const limpo = podar(bruto);
      if (limpo === "" || limpo === undefined) continue;
      if (Array.isArray(limpo) && limpo.length === 0) continue;
      saida[chave] = limpo;
    }
    return saida as T;
  }
  return valor;
}

type Props<T> = { valor: T; aoMudar: (v: T) => void };

/* ─────────────────────────── editores ─────────────────────────── */

function EditorEntendimento({ valor, aoMudar }: Props<Entendimento>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
        placeholder="O que entendemos"
      />
      <ListaDeTextos
        rotulo="Parágrafos"
        dica="O problema do cliente, nas palavras dele. É o que prova que você ouviu."
        multilinha
        valores={valor.paragrafos}
        aoMudar={(p) => aoMudar({ ...valor, paragrafos: p })}
        rotuloAdicionar="Adicionar parágrafo"
      />
      <CampoArea
        rotulo="Citação do cliente"
        dica="Frase dita por ele na reunião. Deixe vazio para não exibir."
        linhas={3}
        valor={valor.citacaoCliente?.texto ?? ""}
        aoMudar={(t) =>
          aoMudar({ ...valor, citacaoCliente: { ...valor.citacaoCliente, texto: t } })
        }
      />
      <CampoTexto
        rotulo="Quem disse"
        valor={valor.citacaoCliente?.autor ?? ""}
        aoMudar={(a) =>
          aoMudar({
            ...valor,
            citacaoCliente: { texto: valor.citacaoCliente?.texto ?? "", autor: a },
          })
        }
      />
    </>
  );
}

function EditorSolucao({ valor, aoMudar }: Props<Solucao>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Resumo"
        dica="O que vamos construir, em linguagem de negócio."
        valor={valor.resumo}
        aoMudar={(r) => aoMudar({ ...valor, resumo: r })}
      />
      <Repetidor
        rotulo="Pilares"
        dica="De 2 a 6. Cada pilar é um cartão na tela."
        itens={valor.pilares}
        aoMudar={(p) => aoMudar({ ...valor, pilares: p })}
        novoItem={() => ({ titulo: "", descricao: "" })}
        rotuloAdicionar="Adicionar pilar"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Nome do pilar"
              valor={item.titulo}
              aoMudar={(t) => atualizar({ ...item, titulo: t })}
            />
            <CampoArea
              rotulo="O que ele resolve"
              linhas={3}
              valor={item.descricao}
              aoMudar={(d) => atualizar({ ...item, descricao: d })}
            />
          </>
        )}
      </Repetidor>
    </>
  );
}

function EditorEscopo({ valor, aoMudar }: Props<Escopo>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        linhas={2}
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />
      <Repetidor
        rotulo="Módulos"
        dica="Cada módulo vira um bloco que abre e fecha na tela."
        itens={valor.modulos}
        aoMudar={(m) => aoMudar({ ...valor, modulos: m })}
        novoItem={() => ({ titulo: "", resumo: "", itens: [""] })}
        rotuloAdicionar="Adicionar módulo"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Nome do módulo"
              valor={item.titulo}
              aoMudar={(t) => atualizar({ ...item, titulo: t })}
            />
            <CampoArea
              rotulo="Resumo"
              dica="Aparece com o bloco fechado."
              linhas={2}
              valor={item.resumo}
              aoMudar={(r) => atualizar({ ...item, resumo: r })}
            />
            <ListaDeTextos
              rotulo="Itens"
              dica="Escreva como Rótulo: explicação. Nunca com travessão."
              valores={item.itens}
              aoMudar={(i) => atualizar({ ...item, itens: i })}
            />
            <ListaDeTextos
              rotulo="Você recebe"
              dica="Artefatos entregues ao final deste módulo."
              valores={item.entregaveis ?? []}
              aoMudar={(e) => atualizar({ ...item, entregaveis: e })}
              rotuloAdicionar="Adicionar entregável"
            />
          </>
        )}
      </Repetidor>
    </>
  );
}

function EditorProcesso({ valor, aoMudar }: Props<Processo>) {
  return (
    <>
      <CampoBooleano
        rotulo="Exibir as seis etapas"
        dica="O conteúdo das etapas é fixo e igual em toda proposta; mora no código."
        valor={valor.mostrar}
        aoMudar={(m) => aoMudar({ ...valor, mostrar: m })}
      />
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        linhas={2}
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />
    </>
  );
}

function EditorCronograma({ valor, aoMudar }: Props<Cronograma>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <Repetidor
        rotulo="Fases"
        itens={valor.fases}
        aoMudar={(f) => aoMudar({ ...valor, fases: f })}
        novoItem={() => ({ nome: "", duracao: "1 semana", semanas: 1 })}
        rotuloAdicionar="Adicionar fase"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Nome da fase"
              valor={item.nome}
              aoMudar={(n) => atualizar({ ...item, nome: n })}
            />
            <CampoTexto
              rotulo="Duração legível"
              dica='O texto que aparece na tela, ex.: "2 semanas".'
              valor={item.duracao}
              aoMudar={(d) => atualizar({ ...item, duracao: d })}
            />
            <CampoNumero
              rotulo="Semanas"
              dica="É a proporção da barra. Precisa bater com a duração acima."
              valor={item.semanas}
              min={1}
              max={104}
              aoMudar={(s) => atualizar({ ...item, semanas: s })}
            />
            <CampoArea
              rotulo="O que acontece nesta fase"
              linhas={2}
              valor={item.descricao ?? ""}
              aoMudar={(d) => atualizar({ ...item, descricao: d })}
            />
          </>
        )}
      </Repetidor>
      <CampoArea
        rotulo="Observação"
        linhas={2}
        valor={valor.observacao ?? ""}
        aoMudar={(o) => aoMudar({ ...valor, observacao: o })}
      />
    </>
  );
}

function EditorResponsabilidades({ valor, aoMudar }: Props<Responsabilidades>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        linhas={2}
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />
      <Repetidor
        rotulo="Itens"
        dica="O que depende do cliente para o projeto andar."
        itens={valor.itens}
        aoMudar={(i) => aoMudar({ ...valor, itens: i })}
        novoItem={() => ({ item: "" })}
        rotuloAdicionar="Adicionar item"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="O que precisamos"
              valor={item.item}
              aoMudar={(t) => atualizar({ ...item, item: t })}
            />
            <CampoArea
              rotulo="Detalhe"
              linhas={2}
              valor={item.detalhe ?? ""}
              aoMudar={(d) => atualizar({ ...item, detalhe: d })}
            />
          </>
        )}
      </Repetidor>
      <CampoArea
        rotulo="Nota"
        linhas={2}
        valor={valor.nota ?? ""}
        aoMudar={(n) => aoMudar({ ...valor, nota: n })}
      />
    </>
  );
}

function EditorSuporte({ valor, aoMudar }: Props<Suporte>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        dica="O que o acompanhamento cobre e por quanto tempo."
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />
      <ListaDeTextos
        rotulo="O que está incluído"
        valores={valor.itens}
        aoMudar={(i) => aoMudar({ ...valor, itens: i })}
      />
      <CampoArea
        rotulo="Depois do período"
        dica="Como ficam manutenções e páginas novas quando o suporte acaba."
        valor={valor.nota ?? ""}
        aoMudar={(n) => aoMudar({ ...valor, nota: n })}
      />
    </>
  );
}

function EditorInvestimento({ valor, aoMudar }: Props<Investimento>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        linhas={2}
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />
      <Repetidor
        rotulo="Opções"
        dica="De 1 a 3. O cliente escolhe QUAL, não SE."
        itens={valor.opcoes}
        aoMudar={(o) => aoMudar({ ...valor, opcoes: o })}
        novoItem={() => ({
          id: `opcao-${Math.floor(Math.random() * 1e6).toString(36)}`,
          nome: "",
          resumo: "",
          valorCentavos: 0,
          itens: [""],
          destaque: false,
        })}
        rotuloAdicionar="Adicionar opção"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Nome da opção"
              valor={item.nome}
              aoMudar={(n) => atualizar({ ...item, nome: n })}
            />
            <CampoArea
              rotulo="Para quem esta opção faz sentido"
              linhas={2}
              valor={item.resumo}
              aoMudar={(r) => atualizar({ ...item, resumo: r })}
            />
            <CampoDinheiro
              rotulo="Valor"
              centavos={item.valorCentavos}
              aoMudar={(v) => atualizar({ ...item, valorCentavos: v })}
            />
            <CampoTexto
              rotulo="Forma de pagamento"
              valor={item.formaPagamento ?? ""}
              aoMudar={(f) => atualizar({ ...item, formaPagamento: f })}
            />
            <CampoTexto
              rotulo="Prazo"
              valor={item.prazo ?? ""}
              aoMudar={(p) => atualizar({ ...item, prazo: p })}
            />
            <ListaDeTextos
              rotulo="O que está incluído"
              valores={item.itens}
              aoMudar={(i) => atualizar({ ...item, itens: i })}
            />
            <CampoBooleano
              rotulo="Recomendada"
              dica="A opção destacada é a que a tabela de pagamento usa para calcular os valores."
              valor={item.destaque}
              aoMudar={(d) => atualizar({ ...item, destaque: d })}
            />
            <CampoTexto
              rotulo="Identificador"
              dica="Fica gravado no aceite. Só minúsculas, números e hífen; não mude depois de enviar."
              valor={item.id}
              aoMudar={(id) => atualizar({ ...item, id })}
            />
          </>
        )}
      </Repetidor>
      <ListaDeTextos
        rotulo="Observações"
        valores={valor.observacoes ?? []}
        aoMudar={(o) => aoMudar({ ...valor, observacoes: o })}
        multilinha
        rotuloAdicionar="Adicionar observação"
      />
    </>
  );
}

function EditorPagamento({ valor, aoMudar }: Props<Pagamento>) {
  const soma = valor.parcelas.reduce((s, p) => s + (p.percentual || 0), 0);

  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Introdução"
        linhas={2}
        valor={valor.introducao ?? ""}
        aoMudar={(i) => aoMudar({ ...valor, introducao: i })}
      />

      <Repetidor
        rotulo="Parcelas"
        dica="Só percentual. O valor em reais é calculado a partir da opção recomendada, para nunca haver dois números discordando."
        itens={valor.parcelas}
        aoMudar={(p) => aoMudar({ ...valor, parcelas: p })}
        novoItem={() => ({ rotulo: "", percentual: 0 })}
        rotuloAdicionar="Adicionar parcela"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Momento do pagamento"
              valor={item.rotulo}
              aoMudar={(r) => atualizar({ ...item, rotulo: r })}
            />
            <CampoNumero
              rotulo="Percentual"
              valor={item.percentual}
              min={1}
              max={100}
              sufixo="%"
              aoMudar={(p) => atualizar({ ...item, percentual: p })}
            />
          </>
        )}
      </Repetidor>

      <p className={`text-sm ${soma === 100 ? "text-neblina" : "text-acento"}`}>
        Soma das parcelas: {soma}%{soma === 100 ? "" : " (precisa dar 100% para salvar)"}
      </p>

      <CampoArea
        rotulo="Nota da tabela"
        linhas={2}
        valor={valor.nota ?? ""}
        aoMudar={(n) => aoMudar({ ...valor, nota: n })}
      />
      <CampoTexto
        rotulo="Título do bloco de cancelamento"
        valor={valor.cancelamento?.titulo ?? ""}
        aoMudar={(t) =>
          aoMudar({
            ...valor,
            cancelamento: { texto: valor.cancelamento?.texto ?? "", titulo: t },
          })
        }
      />
      <CampoArea
        rotulo="Regra de cancelamento"
        valor={valor.cancelamento?.texto ?? ""}
        aoMudar={(t) =>
          aoMudar({
            ...valor,
            cancelamento: { titulo: valor.cancelamento?.titulo, texto: t },
          })
        }
      />
    </>
  );
}

function EditorCustos({ valor, aoMudar }: Props<CustosRecorrentes>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Texto"
        dica="O que fica de fora do valor e por quê."
        valor={valor.texto}
        aoMudar={(t) => aoMudar({ ...valor, texto: t })}
      />
      <Repetidor
        rotulo="Custos recorrentes"
        itens={valor.itens ?? []}
        aoMudar={(i) => aoMudar({ ...valor, itens: i })}
        novoItem={() => ({ item: "" })}
        rotuloAdicionar="Adicionar custo"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Custo"
              valor={item.item}
              aoMudar={(t) => atualizar({ ...item, item: t })}
            />
            <CampoTexto
              rotulo="De quem é e com que frequência"
              valor={item.detalhe ?? ""}
              aoMudar={(d) => atualizar({ ...item, detalhe: d })}
            />
          </>
        )}
      </Repetidor>
    </>
  );
}

function EditorForaDoEscopo({ valor, aoMudar }: Props<ForaDoEscopo>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <ListaDeTextos
        rotulo="O que NÃO está incluído"
        dica="Explícito e sem rodeio. É o que evita discussão depois."
        valores={valor.itens}
        aoMudar={(i) => aoMudar({ ...valor, itens: i })}
      />
      <CampoArea
        rotulo="Nota"
        linhas={2}
        valor={valor.nota ?? ""}
        aoMudar={(n) => aoMudar({ ...valor, nota: n })}
      />
    </>
  );
}

function EditorIndicacao({ valor, aoMudar }: Props<Indicacao>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoNumero
        rotulo="Percentual"
        dica="Sobre o primeiro projeto fechado por indicação."
        valor={valor.percentual}
        min={1}
        max={50}
        sufixo="%"
        aoMudar={(p) => aoMudar({ ...valor, percentual: p })}
      />
      <CampoArea
        rotulo="Como funciona"
        linhas={5}
        valor={valor.texto}
        aoMudar={(t) => aoMudar({ ...valor, texto: t })}
      />
    </>
  );
}

function EditorSobre({ valor, aoMudar }: Props<Sobre>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Sobre a SoftCode"
        linhas={4}
        valor={valor.texto}
        aoMudar={(t) => aoMudar({ ...valor, texto: t })}
      />
      <Repetidor
        rotulo="Cases"
        dica="Resultado mensurável, sem adjetivo. Case sem número convence menos que nenhum."
        itens={valor.cases ?? []}
        aoMudar={(c) => aoMudar({ ...valor, cases: c })}
        novoItem={() => ({ cliente: "", segmento: "", resultado: "" })}
        rotuloAdicionar="Adicionar case"
      >
        {(item, atualizar) => (
          <>
            <CampoTexto
              rotulo="Cliente"
              valor={item.cliente}
              aoMudar={(c) => atualizar({ ...item, cliente: c })}
            />
            <CampoTexto
              rotulo="Segmento"
              valor={item.segmento}
              aoMudar={(s) => atualizar({ ...item, segmento: s })}
            />
            <CampoArea
              rotulo="Resultado"
              linhas={2}
              valor={item.resultado}
              aoMudar={(r) => atualizar({ ...item, resultado: r })}
            />
            <CampoTexto
              rotulo="Link do case"
              valor={item.url ?? ""}
              aoMudar={(u) => atualizar({ ...item, url: u })}
            />
          </>
        )}
      </Repetidor>
    </>
  );
}

function EditorFinais({ valor, aoMudar }: Props<Finais>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <ListaDeTextos
        rotulo="Parágrafos"
        multilinha
        valores={valor.paragrafos}
        aoMudar={(p) => aoMudar({ ...valor, paragrafos: p })}
        rotuloAdicionar="Adicionar parágrafo"
      />
      <CampoTexto
        rotulo="Linha de contato"
        valor={valor.contato ?? ""}
        aoMudar={(c) => aoMudar({ ...valor, contato: c })}
      />
    </>
  );
}

function EditorAceite({ valor, aoMudar }: Props<Aceite>) {
  return (
    <>
      <CampoTexto
        rotulo="Título da seção"
        valor={valor.titulo ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, titulo: t })}
      />
      <CampoArea
        rotulo="Frase acima do botão"
        linhas={3}
        valor={valor.texto ?? ""}
        aoMudar={(t) => aoMudar({ ...valor, texto: t })}
      />
      <CampoBooleano
        rotulo="Exibir o botão de baixar em PDF"
        valor={valor.mostrarPdf}
        aoMudar={(m) => aoMudar({ ...valor, mostrarPdf: m })}
      />
    </>
  );
}

/* ─────────────────────────── registro ─────────────────────────── */

type EditorGenerico = (p: Props<never>) => ReactNode;

export type DefinicaoDeSecao = {
  rotulo: string;
  resumo: string;
  doCliente?: boolean;
  padrao: () => unknown;
  Editor: EditorGenerico;
};

/**
 * `doCliente: true` marca as seções que o modelo NÃO preenche, porque mudam a
 * cada proposta. É por elas que o painel avisa o que ainda falta.
 *
 * O `as unknown as EditorGenerico` é o único ponto solto: cada editor conhece o
 * seu tipo, o registro não. A alternativa seria um mapa genérico por chave, que
 * custa mais complexidade do que resolve num arquivo que já é uma tabela.
 */
export const SECOES: Record<ChaveSecao, DefinicaoDeSecao> = {
  entendimento: {
    rotulo: "O que entendemos",
    resumo: "O problema do cliente, nas palavras dele",
    doCliente: true,
    padrao: () => ({ paragrafos: [""] }) satisfies Entendimento,
    Editor: EditorEntendimento as unknown as EditorGenerico,
  },
  solucao: {
    rotulo: "A solução proposta",
    resumo: "O que vamos construir e os pilares",
    doCliente: true,
    padrao: () =>
      ({
        resumo: "",
        pilares: [
          { titulo: "", descricao: "" },
          { titulo: "", descricao: "" },
        ],
      }) satisfies Solucao,
    Editor: EditorSolucao as unknown as EditorGenerico,
  },
  escopo: {
    rotulo: "Escopo detalhado",
    resumo: "Módulos e o que está incluso em cada um",
    doCliente: true,
    padrao: () =>
      ({ modulos: [{ titulo: "", resumo: "", itens: [""] }] }) satisfies Escopo,
    Editor: EditorEscopo as unknown as EditorGenerico,
  },
  processo: {
    rotulo: "Como trabalhamos",
    resumo: "As seis etapas fixas",
    padrao: () => ({ mostrar: true }) satisfies Processo,
    Editor: EditorProcesso as unknown as EditorGenerico,
  },
  cronograma: {
    rotulo: "Cronograma",
    resumo: "Fases e duração",
    doCliente: true,
    padrao: () =>
      ({ fases: [{ nome: "", duracao: "1 semana", semanas: 1 }] }) satisfies Cronograma,
    Editor: EditorCronograma as unknown as EditorGenerico,
  },
  responsabilidades: {
    rotulo: "O que precisamos de você",
    resumo: "O que depende do cliente",
    padrao: () => ({ itens: [{ item: "" }] }) satisfies Responsabilidades,
    Editor: EditorResponsabilidades as unknown as EditorGenerico,
  },
  suporte: {
    rotulo: "Suporte após a entrega",
    resumo: "O acompanhamento incluído",
    padrao: () => ({ itens: [""] }) satisfies Suporte,
    Editor: EditorSuporte as unknown as EditorGenerico,
  },
  investimento: {
    rotulo: "Investimento",
    resumo: "As opções e os valores",
    padrao: () =>
      ({
        opcoes: [
          {
            id: "opcao-1",
            nome: "",
            resumo: "",
            valorCentavos: 0,
            itens: [""],
            destaque: true,
          },
        ],
      }) satisfies Investimento,
    Editor: EditorInvestimento as unknown as EditorGenerico,
  },
  pagamento: {
    rotulo: "Como o pagamento funciona",
    resumo: "Parcelas em percentual do total",
    padrao: () =>
      ({
        parcelas: [
          { rotulo: "Entrada, ao aprovar a proposta", percentual: 25 },
          { rotulo: "Pagamento final, com o site entregue e aprovado", percentual: 75 },
        ],
      }) satisfies Pagamento,
    Editor: EditorPagamento as unknown as EditorGenerico,
  },
  custosRecorrentes: {
    rotulo: "Custos que não estão no valor",
    resumo: "Domínio, hospedagem e afins",
    padrao: () => ({ texto: "" }) satisfies CustosRecorrentes,
    Editor: EditorCustos as unknown as EditorGenerico,
  },
  foraDoEscopo: {
    rotulo: "Fora do escopo",
    resumo: "O que não está incluído",
    padrao: () => ({ itens: [""] }) satisfies ForaDoEscopo,
    Editor: EditorForaDoEscopo as unknown as EditorGenerico,
  },
  indicacao: {
    rotulo: "Programa de indicação",
    resumo: "O percentual por indicação fechada",
    padrao: () => ({ texto: "", percentual: 10 }) satisfies Indicacao,
    Editor: EditorIndicacao as unknown as EditorGenerico,
  },
  sobre: {
    rotulo: "Sobre a SoftCode",
    resumo: "Quem faz e os cases",
    padrao: () => ({ texto: "" }) satisfies Sobre,
    Editor: EditorSobre as unknown as EditorGenerico,
  },
  finais: {
    rotulo: "Considerações finais",
    resumo: "O fecho, antes do aceite",
    padrao: () => ({ paragrafos: [""] }) satisfies Finais,
    Editor: EditorFinais as unknown as EditorGenerico,
  },
  aceite: {
    rotulo: "Aceite",
    resumo: "A frase e o botão final",
    padrao: () => ({ mostrarPdf: true }) satisfies Aceite,
    Editor: EditorAceite as unknown as EditorGenerico,
  },
};

export type ConteudoEditavel = Conteudo;
