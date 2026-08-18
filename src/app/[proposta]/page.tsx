import { Fragment } from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

import { buscarPropostaPorCaminho } from "@/lib/proposta/seed";
import { caminhoPublico, type ChaveSecao } from "@/lib/proposta/schema";
import { estaExpirada } from "@/lib/proposta/formatar";

import { Hero } from "@/components/secoes/Hero";
import { CabecalhoFixo } from "@/components/secoes/CabecalhoFixo";
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

/**
 * Três tons, não dois. A divisão continua SECA — sem gradiente, sem blur, sem
 * curva —, mas agora existe um terceiro registro: o capítulo NOITE.
 *
 * Ele resolve duas coisas de uma vez: vidro só existe se houver algo atrás
 * dele (sobre branco chapado o backdrop-filter cobra GPU e não entrega nada),
 * e o contraste claro/escuro vira o ritmo da página sem precisar de divisória.
 *
 * Os capítulos escuros são os momentos-âncora — onde o cliente decide.
 */
const CLARO = "#ffffff";
const AZUL_CLARO = "#f0f6ff";
const NOITE = "#0a1420";

const CAPITULOS_NOITE = new Set<ChaveSecao>(["processo", "investimento", "aceite"]);

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

  /** A seção existe? Precisa ser decidido ANTES de numerar. */
  const presente = (chave: ChaveSecao): boolean => {
    if (chave === "aceite") return Boolean(conteudo.aceite && conteudo.investimento);
    return Boolean(conteudo[chave]);
  };

  /**
   * A etiqueta ("01", "02"...) vem da POSIÇÃO, não do componente. Era fixa em
   * cada seção, e por isso Sobre e Responsabilidades vinham ambas com "08".
   * Como `conteudo.ordem` pode reordenar tudo, derivar é o único jeito certo.
   */
  const montar = (chave: ChaveSecao, numero: number): React.ReactNode => {
    switch (chave) {
      case "entendimento":
        return <Entendimento dados={conteudo.entendimento!} numero={numero} />;
      case "solucao":
        return <Solucao dados={conteudo.solucao!} numero={numero} />;
      case "escopo":
        return <Escopo dados={conteudo.escopo!} numero={numero} />;
      case "processo":
        return <Processo dados={conteudo.processo!} numero={numero} />;
      case "cronograma":
        return <Cronograma dados={conteudo.cronograma!} numero={numero} />;
      case "investimento":
        return <Investimento dados={conteudo.investimento!} numero={numero} />;
      case "foraDoEscopo":
        return <ForaDoEscopo dados={conteudo.foraDoEscopo!} numero={numero} />;
      case "responsabilidades":
        return <Responsabilidades dados={conteudo.responsabilidades!} numero={numero} />;
      case "sobre":
        return <Sobre dados={conteudo.sobre!} numero={numero} />;
      case "aceite":
        return (
          <Aceite
            dados={conteudo.aceite!}
            opcoes={conteudo.investimento!.opcoes}
            empresa={cliente.empresa}
            projeto={proposta.tituloProjeto}
            numero={numero}
            caminho={caminhoPublico(proposta)}
          />
        );
    }
  };

  const blocos = ordem.filter(presente);

  /** As seções claras alternam entre branco e azul claro; as âncoras são noite. */
  const tomDe = (chave: ChaveSecao, i: number) =>
    CAPITULOS_NOITE.has(chave) ? NOITE : i % 2 === 0 ? AZUL_CLARO : CLARO;

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
        {blocos.map((chave, i) => (
          <Fragment key={chave}>
            <div
              data-capitulo={CAPITULOS_NOITE.has(chave) ? "noite" : "dia"}
              style={{ backgroundColor: tomDe(chave, i) }}
            >
              {montar(chave, i + 1)}
            </div>
          </Fragment>
        ))}
      </main>

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
