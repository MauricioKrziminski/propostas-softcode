import { ImageResponse } from "next/og";

import { COR_OG, FONTES_OG, SIMBOLO_OG, TAMANHO_OG } from "@/lib/og";

/**
 * O card de qualquer endereço que NÃO seja uma proposta: a raiz, o 404, e o que
 * mais aparecer depois.
 *
 * Ele existe porque link sem imagem, no WhatsApp, chega como uma linha cinza de
 * texto e passa por golpe. Como aqui não há proposta para mostrar, o card fala
 * do que este endereço é, sem revelar nada: mesma paleta noite, mesma tipografia
 * e a frase que a portaria usa.
 */
/* As fontes e a marca são LIDAS DO DISCO (ver `src/lib/og.ts`), e rota de imagem
   roda em Edge por padrão, onde `node:fs` não existe: sem esta linha a rota
   morre sem resposta, e o link chega sem card nenhum. */
export const runtime = "nodejs";

export const alt = "Propostas comerciais da SoftCode";
export const size = TAMANHO_OG;
export const contentType = "image/png";

export default function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COR_OG.fundo,
          /* Gradiente no lugar de um círculo chapado: o renderizador do card
             não tem blur, e a forma sólida virava uma mancha de borda dura. */
          backgroundImage:
            "radial-gradient(1100px 520px at 50% -10%, #16233a 0%, rgba(22,35,58,0) 70%)",
          color: COR_OG.texto,
          fontFamily: "Satoshi",
          padding: 72,
        }}
      >

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SIMBOLO_OG} width={56} height={56} alt="" />
          <span style={{ fontSize: 22, letterSpacing: 6, color: COR_OG.neblina }}>
            SOFTCODE
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 24, letterSpacing: 6, color: COR_OG.acento }}>
            PROPOSTAS COMERCIAIS
          </span>
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 78,
              lineHeight: 1.05,
              marginTop: 16,
              maxWidth: 860,
            }}
          >
            Cada proposta tem um endereço só dela
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 96, height: 3, backgroundColor: COR_OG.acento }} />
          <span style={{ fontSize: 30, marginTop: 22, color: COR_OG.neblina }}>
            propostas.softcodedev.com.br
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: FONTES_OG },
  );
}
