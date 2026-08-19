import { z } from "zod";

import { buscarPropostaPorCaminho } from "@/lib/proposta/repositorio";
import { contaComoVisualizacaoHumana } from "@/lib/crawlers";
import { sessaoValida } from "@/lib/admin/sessao";
import { ehTipoDeEvento, registrarEvento } from "@/lib/eventos";

/**
 * O aviso de que o cliente fez alguma coisa na proposta dele.
 *
 * A rota é pública porque a página é pública: a autorização continua sendo a
 * posse do token na URL, igual ao resto do produto. Por isso ela devolve SEMPRE
 * 204, achando a proposta ou não: um 404 aqui responderia "este slug existe",
 * que é exatamente o que a página se recusa a dizer.
 *
 * Três filtros antes de gravar, e cada um evita um e-mail falso:
 *   · crawler e prefetch, senão colar o link no WhatsApp já avisaria "o cliente
 *     abriu" antes de o cliente abrir;
 *   · sessão de admin, senão conferir a própria proposta manda e-mail para si
 *     mesmo, e o aviso vira ruído logo no primeiro dia;
 *   · rascunho, que ainda não foi enviado a ninguém.
 */
export const runtime = "nodejs";

const entrada = z.object({
  caminho: z.string().min(1).max(120),
  tipo: z.string().max(40),
  detalhe: z
    .object({
      opcaoId: z.string().max(60).optional(),
      opcaoNome: z.string().max(120).optional(),
      valorCentavos: z.number().int().nonnegative().optional(),
      canal: z.string().max(40).optional(),
    })
    .optional(),
});

const ACEITO = new Response(null, { status: 204 });

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return ACEITO;
  }

  const dados = entrada.safeParse(corpo);
  if (!dados.success || !ehTipoDeEvento(dados.data.tipo)) return ACEITO;

  const cabecalhos = req.headers;
  if (
    !contaComoVisualizacaoHumana({
      userAgent: cabecalhos.get("user-agent"),
      purpose: cabecalhos.get("purpose"),
      secPurpose: cabecalhos.get("sec-purpose"),
      xPurpose: cabecalhos.get("x-purpose"),
    })
  ) {
    return ACEITO;
  }

  if (await sessaoValida()) return ACEITO;

  const proposta = await buscarPropostaPorCaminho(dados.data.caminho);
  if (!proposta || proposta.status === "rascunho") return ACEITO;

  await registrarEvento(proposta, dados.data.tipo, {
    detalhe: dados.data.detalhe,
    /* O primeiro endereço do `x-forwarded-for` é o do cliente; o resto são os
       proxies pelo caminho. Localmente nenhum dos dois existe. */
    ip: cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ?? cabecalhos.get("x-real-ip"),
    userAgent: cabecalhos.get("user-agent"),
  });

  return ACEITO;
}
