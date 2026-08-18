import { BotaoLink } from "@/components/ui/Botao";
import { LinkDeEmail, Portaria } from "@/components/ui/Portaria";
import { CONTATO } from "@/lib/contato";

/**
 * Raiz institucional mínima. ZERO links para propostas: não existe listagem
 * neste site, e esta página não pode virar a porta dos fundos de uma.
 */
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
          escreva para <LinkDeEmail />.
        </>
      }
      acoes={
        <>
          <BotaoLink
            variante="solido"
            href={`mailto:${CONTATO.email}`}
            className="whitespace-nowrap"
          >
            Falar com a gente
          </BotaoLink>
          <BotaoLink
            href={CONTATO.site}
            target="_blank"
            rel="noopener noreferrer nofollow"
            referrerPolicy="no-referrer"
            className="whitespace-nowrap"
          >
            Conhecer a SoftCode
          </BotaoLink>
        </>
      }
    />
  );
}
