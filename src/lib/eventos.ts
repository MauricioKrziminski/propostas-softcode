import "server-only";

import { and, count, eq, gte, sql } from "drizzle-orm";

import { bd } from "@/lib/banco/cliente";
import { propostaEventos } from "@/lib/banco/esquema";
import { formatarValor } from "@/lib/proposta/formatar";
import type { PropostaComId } from "@/lib/proposta/repositorio";

/**
 * O que o cliente fez, e o e-mail que avisa a SoftCode.
 *
 * A ordem das operações aqui não é arbitrária: PRIMEIRO grava, DEPOIS envia, e
 * só envia se a gravação criou linha. Quem decide se o aviso sai é o índice
 * único do banco (`on conflict do nothing`), não um `if` nesta camada. É a
 * diferença entre "não mandar e-mail repetido" e "achar que não mandou".
 *
 * Nada aqui pode derrubar o que chamou. Registrar visita é acessório; a página
 * do cliente é o produto. Toda falha vira log e segue.
 */

/** Os tipos de evento, e como cada um aparece no assunto do e-mail. */
export const EVENTOS = {
  convite_aberto: "abriu o link",
  proposta_aberta: "entrou na proposta",
  pdf_baixado: "baixou o PDF",
  contato: "clicou para conversar",
  aceite: "ACEITOU a proposta",
} as const;

export type TipoEvento = keyof typeof EVENTOS;

export function ehTipoDeEvento(v: unknown): v is TipoEvento {
  return typeof v === "string" && v in EVENTOS;
}

export type DetalheEvento = {
  /** Aceite: qual opção o cliente escolheu. */
  opcaoId?: string;
  opcaoNome?: string;
  valorCentavos?: number;
  /** Por onde ele saiu: WhatsApp ou e-mail. */
  canal?: string;
};

/**
 * NADA deduplica: cada abertura é um e-mail.
 *
 * A versão anterior usava a DATA como chave para abrir, entrar e baixar, com o
 * argumento de que "o mesmo cliente recarregando a página não é notícia". Na
 * prática a informação de venda é justamente a frequência: cliente que volta
 * três vezes no mesmo dia está decidindo, e isso é o momento de ligar para ele.
 * Decisão do Gabriel, e ela troca uma caixa de entrada mais cheia por não
 * perder esse sinal.
 *
 * Chave aleatória por evento, então o índice único `(proposta_id, tipo, chave)`
 * nunca colide e toda linha nasce. O que impede a caixa de virar despejo passa
 * a ser SÓ o teto diário, que antes existia apenas para o aceite.
 */
function chaveDe(_tipo: TipoEvento): string {
  return crypto.randomUUID();
}

/**
 * O teto diário por proposta e por tipo. Ele não é meta, é freio: existe para o
 * caso de uma aba presa recarregando sozinha, não para o cliente que abre
 * bastante.
 *
 * O aceite continua em 8, e mais apertado de propósito: quem tem o link tem o
 * botão, e ali cada clique é uma confirmação, não uma visita.
 */
const TETO_DIARIO: Record<TipoEvento, number> = {
  convite_aberto: 40,
  proposta_aberta: 40,
  pdf_baixado: 40,
  contato: 40,
  aceite: 8,
};

/* ───────────────────────────── gravação ───────────────────────────── */

export async function registrarEvento(
  proposta: PropostaComId,
  tipo: TipoEvento,
  extras: { detalhe?: DetalheEvento; ip?: string | null; userAgent?: string | null } = {},
): Promise<void> {
  try {
    const teto = TETO_DIARIO[tipo];
    if ((await eventosDeHoje(proposta.id, tipo)) >= teto) {
      console.warn(`[eventos] teto diário de "${tipo}" (${teto}) atingido em ${proposta.caminho}`);
      return;
    }

    const [linha] = await bd()
      .insert(propostaEventos)
      .values({
        propostaId: proposta.id,
        tipo,
        chave: chaveDe(tipo),
        detalhe: extras.detalhe ?? null,
        /* IP e navegador só no aceite: é o registro que a seção de aceite
           promete ao cliente, em texto, e é o que dá validade a ele. Guardar o
           IP de cada abertura de página seria coletar dado sem uso. */
        ip: tipo === "aceite" ? (extras.ip ?? null) : null,
        userAgent: tipo === "aceite" ? (extras.userAgent ?? null) : null,
      })
      .onConflictDoNothing()
      .returning({ id: propostaEventos.id });

    /* Nada deduplica mais, então a linha sempre nasce. A guarda fica porque
       `onConflictDoNothing` continua no caminho: se um dia voltar a existir
       chave determinística, o e-mail volta a depender do banco sozinho. */
    if (!linha) return;

    await enviarAviso(proposta, tipo, extras.detalhe, extras.ip, extras.userAgent);
  } catch (erro) {
    console.error(`[eventos] falhei em registrar "${tipo}" de ${proposta.caminho}:`, erro);
  }
}

/**
 * Quantos eventos deste tipo já saíram hoje nesta proposta.
 *
 * Como nada mais deduplica, este contador é o ÚNICO freio da caixa de entrada:
 * antes ele valia só para o aceite, agora vale para todos os tipos.
 */
async function eventosDeHoje(propostaId: string, tipo: TipoEvento): Promise<number> {
  const [linha] = await bd()
    .select({ total: count() })
    .from(propostaEventos)
    .where(
      and(
        eq(propostaEventos.propostaId, propostaId),
        eq(propostaEventos.tipo, tipo),
        gte(propostaEventos.criadoEm, sql`current_date`),
      ),
    );
  return Number(linha?.total ?? 0);
}

/**
 * Apaga os registros de ACESSO com mais de 180 dias.
 *
 * O rodapé promete isso ao cliente em texto ("os registros de acesso são
 * apagados após 180 dias"), e até agora não havia nada por trás: o único cron
 * do projeto é o pulso, que roda `select 1` para o Supabase não hibernar.
 * Promessa escrita ao titular sem implementação é pior do que não prometer.
 *
 * O ACEITE fica de fora, e não é esquecimento. Ele é a comprovação que a seção
 * de aceite promete em texto (data, hora, IP e navegador) e é o que cumpre o
 * papel da assinatura no PDF: apagá-lo em 180 dias destruiria a prova do
 * negócio fechado. O que o rodapé promete apagar é registro de ACESSO, que é
 * outra coisa, e o rodapé diz essa diferença.
 *
 * Roda no cron diário que já existe. Nunca derruba o pulso: quem chama trata a
 * falha, porque manter o banco acordado importa mais do que expurgar hoje.
 */
export async function expurgarAcessosAntigos(dias = 180): Promise<number> {
  const resultado = await bd().execute(sql`
    delete from proposta_eventos
    where tipo <> 'aceite'
      and criado_em < now() - make_interval(days => ${dias})
  `);
  /* O driver devolve a contagem em `count`; o tipo do drizzle não promete isso,
     então a leitura é defensiva. O número só serve para o log e a resposta. */
  return Number((resultado as unknown as { count?: number }).count ?? 0);
}

/* ───────────────────────────── o e-mail ───────────────────────────── */

const AGORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "full",
  timeStyle: "short",
});

/** Texto vindo do banco entra no HTML do e-mail: escapa, sempre. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * O endereço absoluto dos links do e-mail. Vale a mesma pegadinha do
 * `metadataBase` no layout: variável VAZIA não é variável ausente, e `??`
 * deixaria a string vazia passar, produzindo um link para `/barba-log-...`
 * que só funciona dentro do próprio site. Aqui o vazio cai no próximo da fila.
 */
function urlBase(): string {
  const candidatos = [
    process.env.NEXT_PUBLIC_URL_BASE,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    "http://localhost:3000",
  ];
  for (const bruto of candidatos) {
    const valor = bruto?.trim().replace(/\/+$/, "");
    if (valor) return valor;
  }
  return "http://localhost:3000";
}

async function enviarAviso(
  proposta: PropostaComId,
  tipo: TipoEvento,
  detalhe?: DetalheEvento,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  const empresa = escapar(proposta.cliente.empresa);
  const contato = escapar(proposta.cliente.nome);
  const projeto = escapar(proposta.tituloProjeto);
  const fechou = tipo === "aceite";

  const assunto = fechou
    ? `${empresa} ACEITOU: ${projeto}`
    : `${empresa} ${EVENTOS[tipo]}: ${projeto}`;

  const linhas: string[] = [
    linhaDoQuadro("Empresa", empresa),
    linhaDoQuadro("Contato", contato),
    linhaDoQuadro("Proposta", projeto),
    linhaDoQuadro("Quando", AGORA.format(new Date())),
  ];

  if (detalhe?.opcaoNome) {
    linhas.push(linhaDoQuadro("Opção escolhida", escapar(detalhe.opcaoNome)));
  }
  if (typeof detalhe?.valorCentavos === "number") {
    linhas.push(linhaDoQuadro("Valor", formatarValor(detalhe.valorCentavos)));
  }
  if (detalhe?.canal) {
    linhas.push(linhaDoQuadro("Saiu por", escapar(detalhe.canal)));
  }
  /* Só o aceite carrega IP e navegador, e é ele que precisa: são a prova do
     registro que substitui a assinatura no PDF. */
  if (fechou && ip) linhas.push(linhaDoQuadro("Endereço IP", escapar(ip)));
  if (fechou && userAgent) linhas.push(linhaDoQuadro("Navegador", escapar(userAgent)));

  const html = `
<div style="background:#f0f6ff;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #c7d9f5;border-radius:16px;overflow:hidden">
    <div style="background:${fechou ? "#0d1b2a" : "#2563eb"};padding:20px 28px">
      <p style="margin:0;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#ffffff;opacity:.75">
        Propostas SoftCode
      </p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff">
        ${fechou ? "Fechou negócio" : `O cliente ${EVENTOS[tipo]}`}
      </p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${linhas.join("")}</table>
    <div style="padding:0 28px 28px">
      <a href="${urlBase()}/${proposta.caminho}"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">
        Abrir a proposta
      </a>
      <a href="${urlBase()}/painel"
         style="display:inline-block;margin-left:10px;color:#2563eb;text-decoration:none;padding:12px 0;font-size:14px">
        Ver no painel
      </a>
    </div>
  </div>
</div>`.trim();

  await enviarPeloResend(assunto, html);
}

function linhaDoQuadro(rotulo: string, valor: string): string {
  return `<tr>
    <td style="padding:12px 28px;border-bottom:1px solid #e2e8f0;color:#64748b;white-space:nowrap;vertical-align:top">${rotulo}</td>
    <td style="padding:12px 28px 12px 0;border-bottom:1px solid #e2e8f0;text-align:right;word-break:break-word">${valor}</td>
  </tr>`;
}

/**
 * O envio, em HTTP puro.
 *
 * Uma dependência a mais para montar um POST de seis campos não se paga, e o
 * SDK do Resend usa `replyTo` enquanto a API REST usa `reply_to`: escrever o
 * `fetch` deixa isso visível em vez de escondido atrás de um adaptador.
 *
 * A retentativa cobre só falha de REDE e erro 5xx. 4xx é configuração errada
 * (domínio não verificado, chave inválida) e repetir não conserta nada.
 */
async function enviarPeloResend(assunto: string, html: string): Promise<void> {
  /**
   * Em desenvolvimento não sai e-mail, e isso não é preciosismo: o
   * `npm run valida:mobile` abre a proposta num Chromium de verdade, com
   * user-agent de iPhone de verdade, e é por definição indistinguível de um
   * cliente. Rodando ao final de toda fase, ele mandava três avisos por
   * execução para a caixa que deveria receber só cliente.
   *
   * A linha continua sendo gravada, então dedupe e filtro continuam sendo
   * exercitados localmente. Para conferir o e-mail em si: `EVENTOS_EM_DEV=1`.
   */
  if (process.env.NODE_ENV !== "production" && process.env.EVENTOS_EM_DEV !== "1") {
    console.info(`[eventos] em desenvolvimento não envio. Assunto seria: ${assunto}`);
    return;
  }

  const chave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM;
  const para = process.env.CONTACT_INBOX;

  if (!chave || !de || !para) {
    console.warn(
      `[eventos] Resend não configurado (RESEND_API_KEY, EMAIL_FROM, CONTACT_INBOX). ` +
        `Aviso não enviado: ${assunto}`,
    );
    return;
  }

  const corpo = JSON.stringify({
    from: de,
    to: [para],
    subject: assunto,
    html,
    ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
  });

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const resposta = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: corpo,
      });
      if (resposta.ok) return;

      const texto = await resposta.text();
      console.error(`[eventos] Resend recusou (${resposta.status}): ${texto}`);
      if (resposta.status < 500) return; /* erro nosso: repetir não muda nada */
    } catch (erro) {
      console.error("[eventos] falha de rede ao falar com o Resend:", erro);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}
