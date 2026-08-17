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
import { Sobre } from "@/components/secoes/Sobre";
import { Aceite } from "@/components/secoes/Aceite";
import { Expirada } from "@/components/secoes/Expirada";
import { RodapeLegal } from "@/components/secoes/RodapeLegal";

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
  "sobre",
  "aceite",
];

type Props = { params: Promise<{ proposta: string }> };

/**
 * O OG image é gerado por `opengraph-image.tsx` ao lado deste arquivo.
 * `noindex` continua valendo: quem lê OG é expansor de link, não indexador.
 */
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

  // Não encontrada e rascunho caem no mesmo 404 genérico: a resposta nunca
  // revela se um slug existe.
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

  const secoes: Record<ChaveSecao, React.ReactNode> = {
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

  return (
    <>
      <CabecalhoFixo empresa={cliente.empresa} />

      <Hero
        empresa={cliente.empresa}
        cliente={cliente.nome}
        projeto={proposta.tituloProjeto}
        emitidaEm={proposta.emitidaEm}
        validaAte={proposta.validaAte}
        expirada={expirada}
      />

      <main>
        {ordem.map((chave) => (
          <div key={chave}>{secoes[chave]}</div>
        ))}
      </main>

      <RodapeLegal
        caminho={caminhoPublico(proposta)}
        emitidaEm={proposta.emitidaEm}
        validaAte={proposta.validaAte}
      />

      <PreparaImpressao />
      <LuzDoPonteiro />
    </>
  );
}
