import type { DetalheEvento, TipoEvento } from "@/lib/eventos";

/**
 * O lado do navegador do aviso: dispara e esquece.
 *
 * `import type` acima é erasado na compilação, então `@/lib/eventos` (que é
 * `server-only`, e carrega a conexão do banco) nunca entra no bundle do cliente.
 * Trocar por um import normal quebraria o build, e é essa a intenção.
 *
 * `sendBeacon` primeiro porque ele é o único que SOBREVIVE à navegação: o clique
 * do aceite abre o WhatsApp, o navegador do celular joga a aba para segundo
 * plano, e um `fetch` comum morre no meio do caminho justamente no evento que
 * mais importa. `keepalive` é o plano B para quem não tem `sendBeacon`.
 *
 * Nenhuma falha aqui aparece para o cliente: ele está lendo uma proposta, não
 * operando um painel de telemetria.
 */
export function avisar(caminho: string, tipo: TipoEvento, detalhe?: DetalheEvento): void {
  const corpo = JSON.stringify({ caminho, tipo, detalhe });

  try {
    const enviou = navigator.sendBeacon?.(
      "/api/eventos",
      new Blob([corpo], { type: "application/json" }),
    );
    if (enviou) return;
  } catch {
    /* alguns navegadores lançam em vez de devolver false; o plano B cobre */
  }

  void fetch("/api/eventos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo,
    keepalive: true,
  }).catch(() => {});
}
