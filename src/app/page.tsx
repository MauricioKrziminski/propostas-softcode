import type { Viewport } from "next";

import { Portaria } from "@/components/ui/Portaria";

/**
 * Raiz institucional mínima. ZERO links para propostas: não existe listagem
 * neste site, e esta página não pode virar a porta dos fundos de uma.
 */
export const viewport: Viewport = {
  /* A portaria é escura, então a barra do navegador acompanha. Sem isto, o
     celular desenha uma faixa branca colada num fundo navy. */
  themeColor: "#0a1420",
  colorScheme: "dark",
};

export default function Home() {
  return (
    <Portaria
      etiqueta="propostas comerciais"
      titulo="Cada proposta tem um endereço só dela"
      texto={
        <>
          Este endereço hospeda as propostas que a SoftCode envia. Cada cliente recebe um
          link próprio, e é ele que abre a proposta: aqui não há listagem nem busca.
        </>
      }
      nota={
        <>
          Recebeu um link que não abre? Responda a mesma conversa em que ele chegou, ou
          fale com a gente por qualquer um dos canais acima.
        </>
      }
      mensagemDeContato="Olá! Cheguei pelo site de propostas da SoftCode e queria falar com vocês."
    />
  );
}
