import { renderToBuffer } from "@react-pdf/renderer";

import { DocumentoProposta } from "@/lib/pdf/DocumentoProposta";
import { buscarPropostaPorCaminho } from "@/lib/proposta/seed";
import { caminhoPublico } from "@/lib/proposta/schema";
import { estaExpirada } from "@/lib/proposta/formatar";

/**
 * `/{slug}-{token}/pdf` — o arquivo que o cliente corporativo anexa no processo
 * interno dele.
 *
 * Roda em Node porque `@react-pdf/renderer` precisa do sistema de arquivos para
 * as fontes e a logo. É a razão de não usar Playwright aqui: Chromium
 * empacotado passaria de 300MB, e a Vercel não permite subprocesso.
 *
 * A autorização é a mesma da página: posse do token na URL. Caminho errado dá
 * 404 genérico, sem revelar se o slug existe.
 */
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ proposta: string }> },
) {
  const { proposta: caminho } = await params;
  const proposta = buscarPropostaPorCaminho(caminho);

  if (!proposta || proposta.status === "rascunho") {
    return new Response("Não encontrado", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <DocumentoProposta proposta={proposta} />,
  );

  const arquivo = `Proposta-${proposta.cliente.empresa.replace(/[^\p{L}\p{N}]+/gu, "-")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // `inline` abre no visualizador do navegador; o cliente salva se quiser.
      // `filename` é o que o PDF vira no computador dele — vale o cuidado.
      "Content-Disposition": `inline; filename="${arquivo}"`,
      // Proposta expirada muda de conteúdo; e o documento nunca deve ser
      // cacheado por intermediário, porque a URL é a credencial.
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Proposta-Expirada": String(estaExpirada(proposta.validaAte)),
      "X-Caminho": caminhoPublico(proposta),
    },
  });
}
