import { pulsar } from "@/lib/proposta/repositorio";

/**
 * O batimento que mantém o banco acordado.
 *
 * Projeto Supabase no plano gratuito PAUSA depois de sete dias sem nenhuma
 * requisição, e o banco pausado não responde: a proposta simplesmente para de
 * abrir. O problema é que isso acontece justamente no caso pior, quando o
 * cliente demora para ler o link, e ninguém fica sabendo até ele reclamar.
 *
 * Uma consulta trivial por dia zera o contador. É a mitigação mais barata que
 * existe para esse risco, e some sozinha no dia em que a conta virar paga.
 *
 * A rota não devolve dado nenhum e não recebe parâmetro nenhum, então não há o
 * que proteger além do óbvio: se `CRON_SECRET` existir no ambiente, ela exige o
 * cabeçalho que a Vercel manda junto do cron.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(requisicao: Request) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && requisicao.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não encontrado", { status: 404 });
  }

  try {
    await pulsar();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    console.error("[pulso] banco não respondeu:", erro);
    return Response.json({ ok: false }, { status: 503 });
  }
}
