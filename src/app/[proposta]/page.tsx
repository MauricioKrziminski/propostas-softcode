import { Fragment } from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

import { buscarPropostaPorCaminho } from "@/lib/proposta/seed";
import { caminhoPublico, type ChaveSecao } from "@/lib/proposta/schema";
import { estaExpirada } from "@/lib/proposta/formatar";

import { Hero, CabecalhoFixo } from "@/components/secoes/Hero";
import { Entendimento } from "@/components/secoes/Entendimento";
import { Solucao } from "@/components/secoes/Solucao";
import { Escopo } from "@/components/secoes/Escopo";
import { Processo } from "@/components/secoes/Processo";
import { Cronograma } from "@/components/secoes/Cronograma";
import { Investimento } from "@/components/secoes/Investimento";
import { ForaDoEscopo } from "@/components/secoes/ForaDoEscopo";
import { Responsabilidades } from "@/components/secoes/Responsabilidades";
import { Sobre } from "@/components/secoes/Sobre";
import { Aceite } from "@/components/secoes/Aceite";
import { Expirada } from "@/components/secoes/Expirada";
import { RodapeLegal } from "@/components/secoes/RodapeLegal";
import { AberturaProposta } from "@/components/secoes/AberturaProposta";
import { Corda } from "@/components/motion/Corda";
import { Textura } from "@/components/motion/Textura";

/** JS de enfeite entra por dynamic import — não pesa no carregamento inicial. */
const PreparaImpressao = dynamic(() =>
  import("@/components/motion/PreparaImpressao").then((m) => m.PreparaImpressao),
);
const LuzDoPonteiro = dynamic(() =>
  import("@/components/motion/LuzDoPonteiro").then((m) => m.LuzDoPonteiro),
);

const ORDEM_CANONICA: ChaveSecao[] = [
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
];

/** Tons alternados: a separação entre seções tem que ser explícita. */
const TONS = ["#080808", "#14141a"] as const;

type Props = { params: Promise<{ proposta: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { proposta: caminho } = await params;
  const proposta = buscarPropostaPorCaminho(caminho);
  if (!proposta) return { title: "Proposta" };

  return {
    title: `${proposta.tituloProjeto} — proposta para ${proposta.cliente.empresa}`,
    description: `Proposta comercial da SoftCode para a ${proposta.cliente.empresa}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PaginaProposta({ params }: Props) {
  const { proposta: caminho } = await params;
  const proposta = buscarPropostaPorCaminho(caminho);

  if (!proposta || proposta.status === "rascunho") notFound();

  const expirada = estaExpirada(proposta.validaAte);
  const { conteudo, cliente } = proposta;

  if (expirada) {
    return (
      <Expirada
        empresa={cliente.empresa}
        projeto={proposta.tituloProjeto}
        validaAte={proposta.validaAte}
      />
    );
  }

  const ordem = conteudo.ordem ?? ORDEM_CANONICA;

  const secoes: Partial<Record<ChaveSecao, React.ReactNode>> = {
    entendimento: conteudo.entendimento && (
      <Entendimento dados={conteudo.entendimento} />
    ),
    solucao: conteudo.solucao && <Solucao dados={conteudo.solucao} />,
    escopo: conteudo.escopo && <Escopo dados={conteudo.escopo} />,
    processo: conteudo.processo && <Processo dados={conteudo.processo} />,
    cronograma: conteudo.cronograma && <Cronograma dados={conteudo.cronograma} />,
    investimento: conteudo.investimento && (
      <Investimento dados={conteudo.investimento} />
    ),
    foraDoEscopo: conteudo.foraDoEscopo && (
      <ForaDoEscopo dados={conteudo.foraDoEscopo} />
    ),
    responsabilidades: conteudo.responsabilidades && (
      <Responsabilidades dados={conteudo.responsabilidades} />
    ),
    sobre: conteudo.sobre && <Sobre dados={conteudo.sobre} />,
    aceite: conteudo.aceite && conteudo.investimento && (
      <Aceite
        dados={conteudo.aceite}
        opcoes={conteudo.investimento.opcoes}
        empresa={cliente.empresa}
        projeto={proposta.tituloProjeto}
      />
    ),
  };

  const blocos = ordem
    .map((chave) => ({ chave, node: secoes[chave] }))
    .filter((b) => Boolean(b.node));

  /** O hero é o tom 0; a primeira seção começa no tom 1, e daí alterna. */
  const tomDe = (i: number) => TONS[(i + 1) % 2];

  return (
    <AberturaProposta empresa={cliente.empresa} projeto={proposta.tituloProjeto}>
      <Textura />
      <CabecalhoFixo empresa={cliente.empresa} logoCliente={cliente.logoUrl} />

      <Hero
        empresa={cliente.empresa}
        cliente={cliente.nome}
        projeto={proposta.tituloProjeto}
        emitidaEm={proposta.emitidaEm}
        validaAte={proposta.validaAte}
        expirada={expirada}
      />

      <main>
        {blocos.map((bloco, i) => (
          <Fragment key={bloco.chave}>
            {/* Não existe linha divisória: quem separa é a própria diferença
                de cor, numa curva que cede como corda e se desloca no scroll. */}
            <Corda
              deCima={i === 0 ? TONS[0] : tomDe(i - 1)}
              paraBaixo={tomDe(i)}
              profundidade={i % 3 === 0 ? 0.6 : i % 3 === 1 ? 1 : 1.4}
            />
            <div
              style={{
                backgroundColor: tomDe(i),
                ["--tom" as string]: tomDe(i),
              }}
            >
              {bloco.node}
            </div>
          </Fragment>
        ))}
      </main>

      <Corda deCima={tomDe(blocos.length - 1)} paraBaixo={TONS[0]} profundidade={0.8} />

      <RodapeLegal
        caminho={caminhoPublico(proposta)}
        emitidaEm={proposta.emitidaEm}
        validaAte={proposta.validaAte}
      />

      <PreparaImpressao />
      <LuzDoPonteiro />
    </AberturaProposta>
  );
}
