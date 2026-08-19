import { after } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { DocumentoProposta } from "@/lib/pdf/DocumentoProposta";
import { buscarPropostaPorCaminho } from "@/lib/proposta/repositorio";
import { caminhoPublico } from "@/lib/proposta/schema";
import { estaExpirada } from "@/lib/proposta/formatar";
import { sessaoValida } from "@/lib/admin/sessao";
import { contaComoVisualizacaoHumana } from "@/lib/crawlers";
import { registrarEvento } from "@/lib/eventos";

/**
 * `/{slug}-{token}/pdf`, o arquivo que o cliente corporativo anexa no processo
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
  req: Request,
  { params }: { params: Promise<{ proposta: string }> },
) {
  const { proposta: caminho } = await params;
  const proposta = await buscarPropostaPorCaminho(caminho);

  if (!proposta) {
    return new Response("Não encontrado", { status: 404 });
  }

  /* Mesma regra da página: rascunho só existe para quem tem sessão de admin. */
  const admin = await sessaoValida();
  if (proposta.status === "rascunho" && !admin) {
    return new Response("Não encontrado", { status: 404 });
  }

  /**
   * O download é rastreado AQUI, no servidor, e não no clique do botão: o
   * cliente corporativo salva este endereço e volta nele direto, ou manda para
   * o jurídico. Rastrear no botão perderia justamente essas voltas.
   *
   * `after()` porque o e-mail não pode atrasar o PDF, e porque fogo-e-esquece
   * solto em serverless morre junto com a resposta. Admin, crawler e prefetch
   * ficam de fora: nenhum dos três é o cliente baixando o documento.
   */
  const humano = contaComoVisualizacaoHumana({
    userAgent: req.headers.get("user-agent"),
    purpose: req.headers.get("purpose"),
    secPurpose: req.headers.get("sec-purpose"),
    xPurpose: req.headers.get("x-purpose"),
  });
  if (humano && !admin) {
    after(() => registrarEvento(proposta, "pdf_baixado"));
  }

  const buffer = await renderToBuffer(
    <DocumentoProposta proposta={proposta} />,
  );

  const arquivo = `Proposta-${proposta.cliente.empresa.replace(/[^\p{L}\p{N}]+/gu, "-")}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // `inline` abre no visualizador do navegador; o cliente salva se quiser.
      // `filename` é o que o PDF vira no computador dele, vale o cuidado.
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
