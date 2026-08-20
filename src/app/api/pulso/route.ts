import { pulsar } from "@/lib/proposta/repositorio";
import { expurgarAcessosAntigos } from "@/lib/eventos";

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

    /* O expurgo pega carona no cron que já existe, e vem DEPOIS do pulso de
       propósito: manter o banco acordado é o trabalho crítico desta rota, e
       falhar em apagar hoje não pode custar isso. Por isso ele tem `try` só
       dele. */
    let apagados: number | null = null;
    try {
      apagados = await expurgarAcessosAntigos();
      if (apagados > 0) console.info(`[pulso] ${apagados} registro(s) de acesso expurgado(s)`);
    } catch (erro) {
      console.error("[pulso] falhei em expurgar registros antigos:", erro);
    }

    return Response.json({ ok: true, apagados }, { headers: { "Cache-Control": "no-store" } });
  } catch (erro) {
    console.error("[pulso] banco não respondeu:", erro);
    return Response.json({ ok: false }, { status: 503 });
  }
}
