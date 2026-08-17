import { ImageResponse } from "next/og";
import { buscarPropostaPorCaminho } from "@/lib/proposta/seed";

/**
 * O card do WhatsApp é a primeira impressão da proposta — vem antes de qualquer
 * scroll. Usa a paleta e a hierarquia da página para que o link já pareça a
 * peça, e não um anexo genérico.
 *
 * `next/font` não vale aqui: o runtime da imagem precisa da fonte como
 * ArrayBuffer. Na Fase 1 usamos a face padrão do renderizador e mantemos o peso
 * visual na composição — quando o logo em SVG chegar, carregamos a Archivo junto.
 */
export const alt = "Proposta comercial da SoftCode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagem({
  params,
}: {
  params: Promise<{ proposta: string }>;
}) {
  const { proposta: caminho } = await params;
  const proposta = buscarPropostaPorCaminho(caminho);

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
          backgroundColor: "#0c231d",
          color: "#f4f2ec",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9db2a6",
          }}
        >
          <span>SoftCode</span>
          <span>Proposta comercial</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 26, letterSpacing: 4, color: "#c79a3b" }}>
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
          <div style={{ display: "flex", width: 96, height: 3, backgroundColor: "#c79a3b" }} />
          <span style={{ fontSize: 34, marginTop: 24, color: "#9db2a6" }}>{projeto}</span>
        </div>
      </div>
    ),
    size,
  );
}
