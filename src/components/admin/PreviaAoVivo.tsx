"use client";

import { useEffect, useRef, useState } from "react";

import type { ChaveSecao } from "@/lib/proposta/schema";

/**
 * O espelho: a proposta DE VERDADE, ao lado do editor.
 *
 * Não é uma simulação nem um "preview" aproximado. É a mesma rota que o cliente
 * abre, dentro de um `<iframe>`, na largura de celular, que é onde ela vai ser
 * lida na prática. É o padrão dos CMS que levam edição a sério (Sanity, Craft,
 * Storyblok), e o motivo é simples: ninguém revisa bem um texto sem ver a forma
 * dele.
 *
 * Recarrega ao SALVAR, nunca a cada tecla. A proposta carrega fonte, animação e
 * imagem; recarregar a cada letra seria um moinho de vento caro e piscante.
 */
const ANCORA: Record<ChaveSecao, string> = {
  entendimento: "entendimento",
  solucao: "solucao",
  escopo: "escopo",
  processo: "processo",
  cronograma: "cronograma",
  responsabilidades: "responsabilidades",
  suporte: "suporte",
  investimento: "investimento",
  pagamento: "pagamento",
  custosRecorrentes: "custos-recorrentes",
  foraDoEscopo: "fora-do-escopo",
  indicacao: "indicacao",
  sobre: "sobre",
  finais: "consideracoes-finais",
  aceite: "aceite",
};

export function PreviaAoVivo({
  caminho,
  secao,
  versao,
}: {
  caminho: string;
  secao: string;
  versao: number;
}) {
  const quadro = useRef<HTMLIFrameElement>(null);
  const ancora = secao in ANCORA ? ANCORA[secao as ChaveSecao] : "";

  /* O `src` inicial é fixado uma vez, no primeiro render, e nunca muda por
     dependência do React. Se ele fosse recalculado a cada troca de seção, o
     React reescreveria o atributo e o quadro recarregaria a proposta inteira só
     porque você clicou em outra seção do trilho. */
  const [enderecoInicial] = useState(() => `/${caminho}?previa=1`);
  const ultimaVersao = useRef(versao);

  /* Recarrega SÓ quando a versão muda, ou seja, quando algo foi salvo. */
  useEffect(() => {
    if (ultimaVersao.current === versao) return;
    ultimaVersao.current = versao;
    const el = quadro.current;
    if (!el) return;
    // Âncora no endereço: o documento vai renascer, então rolar agora seria
    // rolar uma página que ainda não existe.
    el.src = `/${caminho}?previa=1${ancora ? `#${ancora}` : ""}`;
  }, [caminho, versao, ancora]);

  /**
   * Os atalhos precisam atravessar a moldura.
   *
   * Depois de clicar na prévia para rolar, o foco fica DENTRO do quadro, e um
   * `⌘K` ali morre no documento de dentro: a janela de fora nunca vê a tecla, e
   * o atalho simplesmente para de funcionar sem explicação. Como a prévia é da
   * mesma origem, dá para escutar lá dentro e repassar para cá.
   */
  useEffect(() => {
    const el = quadro.current;
    if (!el) return;

    function repassar(evento: KeyboardEvent) {
      if (!(evento.metaKey || evento.ctrlKey)) return;
      const tecla = evento.key.toLowerCase();
      if (tecla !== "k" && tecla !== "s") return;
      evento.preventDefault();
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: evento.key,
          metaKey: evento.metaKey,
          ctrlKey: evento.ctrlKey,
          bubbles: true,
        }),
      );
    }

    function ligar() {
      quadro.current?.contentDocument?.addEventListener("keydown", repassar);
    }

    el.addEventListener("load", ligar);
    ligar(); /* o quadro pode já estar carregado quando este efeito roda */
    return () => {
      el.removeEventListener("load", ligar);
      el.contentDocument?.removeEventListener("keydown", repassar);
    };
  }, []);

  /* Troca de seção sem salvar: só rola, sem recarregar. Mesma origem, então o
     documento de dentro é acessível; se não estiver pronto, ignora em silêncio. */
  useEffect(() => {
    if (!ancora) return;
    const doc = quadro.current?.contentDocument;
    const alvo = doc?.getElementById(ancora);
    alvo?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ancora]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="etiqueta-mesa">prévia · como o cliente vê</p>
        <a
          href={`/${caminho}`}
          target="_blank"
          rel="noopener noreferrer"
          className="etiqueta-mesa hover:text-[var(--mesa-acento)]"
        >
          abrir ↗
        </a>
      </div>

      <div className="painel-mesa flex-1 overflow-hidden p-2">
        <iframe
          ref={quadro}
          src={enderecoInicial}
          title="Prévia da proposta"
          loading="lazy"
          className="h-full w-full rounded-[8px] border-0 bg-white"
        />
      </div>
    </div>
  );
}
