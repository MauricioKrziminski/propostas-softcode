import { ImageResponse } from "next/og";
import { buscarPropostaPorCaminho } from "@/lib/proposta/repositorio";

/**
 * O card do WhatsApp é a primeira impressão da proposta, vem antes de qualquer
 * scroll. Usa a paleta da página (branco com azul, herdada dos PDFs da SoftCode)
 * para que o link já pareça a peça, e não um anexo genérico.
 *
 * `next/font` não vale aqui: o runtime da imagem precisa da fonte como
 * ArrayBuffer. Na Fase 1 usamos a face padrão do renderizador e mantemos o peso
 * visual na composição.
 */
export const alt = "Proposta comercial da SoftCode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Espelham os tokens de `globals.css`. O ImageResponse não enxerga o CSS da
   página, então mudar a paleta lá exige mudar aqui, o card já ficou uma fase
   inteira em verde-escuro enquanto a página era azul. */
const FUNDO = "#ffffff";
const AZUL_CLARO = "#f0f6ff";
const NAVY = "#0d1b2a";
const ACENTO = "#2563eb";
const NEBLINA = "#64748b";

export default async function Imagem({
  params,
}: {
  params: Promise<{ proposta: string }>;
}) {
  const { proposta: caminho } = await params;
  const proposta = await buscarPropostaPorCaminho(caminho);

  const empresa = proposta?.cliente.empresa ?? "SoftCode";
  const projeto = proposta?.tituloProjeto ?? "Proposta comercial";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: FUNDO,
          color: NAVY,
          padding: 72,
        }}
      >
        {/* faixa de acento no topo, como o filete do cartão do convite */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: ACENTO,
          }}
        />
        {/* bloco de cor no canto, ecoando a alternância de tons da página */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 420,
            height: 300,
            backgroundColor: AZUL_CLARO,
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: NEBLINA,
          }}
        >
          <span>SoftCode</span>
          <span>Proposta comercial</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 26, letterSpacing: 4, color: ACENTO }}>
            PROPOSTA PARA
          </span>
          <span
            style={{
              fontSize: empresa.length > 18 ? 92 : 128,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: 16,
            }}
          >
            {empresa}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 96, height: 4, backgroundColor: ACENTO }} />
          <span style={{ fontSize: 34, marginTop: 24, color: NEBLINA }}>{projeto}</span>
        </div>
      </div>
    ),
    size,
  );
}
