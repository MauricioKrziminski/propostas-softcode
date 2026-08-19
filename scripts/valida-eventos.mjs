/**
 * Validação do registro de eventos e do aviso por e-mail.
 *
 *   npm run valida:eventos            (usa http://localhost:3000)
 *   npm run valida:eventos -- <url>
 *
 * Precisa do dev server no ar e do banco semeado (`npm run semear`).
 *
 * O que ele prova, e por que cada uma importa:
 *   1. crawler de preview não gera evento (senão colar o link no WhatsApp já
 *      avisaria "o cliente abriu" antes de o cliente abrir);
 *   2. prefetch do navegador também não;
 *   3. caminho inexistente responde 204 e não grava (um 404 aqui diria "este
 *      slug existe", que é o que a página se recusa a dizer);
 *   4. tipo desconhecido é descartado;
 *   5. acesso humano gera UMA linha;
 *   6. o MESMO evento repetido no mesmo dia NÃO gera segunda linha;
 *   7. o aceite gera linha a cada clique, com opção, valor, IP e navegador.
 *
 * Ele limpa as próprias linhas no fim, inclusive se falhar no meio.
 */
import postgres from "postgres";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CAMINHO = "barba-log-7fk2m9x4qd";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

let falhas = 0;

function checar(condicao, textoOk, textoFalha = textoOk, extra = "") {
  if (condicao) {
    console.log(`  ok    ${textoOk}`);
  } else {
    falhas++;
    console.log(`  FALHA ${textoFalha}${extra ? `\n        ${extra}` : ""}`);
  }
}

/** Um POST em /api/eventos, com os cabeçalhos que decidem se ele conta. */
async function avisar(corpo, cabecalhos = {}) {
  const resposta = await fetch(`${BASE}/api/eventos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": IPHONE, ...cabecalhos },
    body: JSON.stringify(corpo),
  });
  /* A rota responde 204 SEMPRE. Qualquer outro código já é falha por si só. */
  checar(resposta.status === 204, `${corpo.tipo} devolveu 204`, `devolveu ${resposta.status}`);
  return resposta.status;
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

/** Quantas linhas de um tipo existem para esta proposta agora. */
async function contar(tipo) {
  const [linha] = await sql`
    select count(*)::int as total
    from proposta_eventos e
    join propostas p on p.id = e.proposta_id
    where p.caminho = ${CAMINHO} and e.tipo = ${tipo}`;
  return linha.total;
}

async function limpar() {
  await sql`
    delete from proposta_eventos
    where proposta_id in (select id from propostas where caminho = ${CAMINHO})`;
}

try {
  const [proposta] = await sql`select 1 from propostas where caminho = ${CAMINHO}`;
  if (!proposta) {
    console.error(`Proposta ${CAMINHO} não existe no banco. Rode: npm run semear`);
    process.exit(1);
  }
  await limpar();

  console.log("\n▸ quem NÃO conta");

  await avisar({ caminho: CAMINHO, tipo: "convite_aberto" }, { "User-Agent": "WhatsApp/2.23" });
  checar((await contar("convite_aberto")) === 0, "crawler de preview não vira evento");

  await avisar({ caminho: CAMINHO, tipo: "convite_aberto" }, { "Sec-Purpose": "prefetch" });
  checar((await contar("convite_aberto")) === 0, "prefetch do navegador não vira evento");

  await avisar({ caminho: "nao-existe-9z9z9z", tipo: "aceite" });
  checar((await contar("aceite")) === 0, "caminho inexistente não vira evento");

  await avisar({ caminho: CAMINHO, tipo: "inventado" });
  const [{ total: inventados }] = await sql`
    select count(*)::int as total from proposta_eventos where tipo = 'inventado'`;
  checar(inventados === 0, "tipo desconhecido é descartado");

  console.log("\n▸ quem conta, e uma vez só");

  await avisar({ caminho: CAMINHO, tipo: "convite_aberto" });
  checar((await contar("convite_aberto")) === 1, "acesso humano gera evento");

  await avisar({ caminho: CAMINHO, tipo: "convite_aberto" });
  checar(
    (await contar("convite_aberto")) === 1,
    "o mesmo evento no mesmo dia não repete",
    "deduplicação falhou: cada recarga viraria um e-mail",
  );

  console.log("\n▸ o aceite");

  const detalhe = {
    opcaoId: "completo",
    opcaoNome: "Plano completo",
    valorCentavos: 1250000,
    canal: "WhatsApp",
  };
  await avisar({ caminho: CAMINHO, tipo: "aceite", detalhe }, { "X-Forwarded-For": "189.45.12.7, 10.0.0.1" });
  await avisar({ caminho: CAMINHO, tipo: "aceite", detalhe }, { "X-Forwarded-For": "189.45.12.7, 10.0.0.1" });
  checar(
    (await contar("aceite")) === 2,
    "aceite NÃO deduplica (cada confirmação avisa)",
    "um aceite foi engolido pela deduplicação",
  );

  const [ultimo] = await sql`
    select e.detalhe, e.ip, e.user_agent
    from proposta_eventos e join propostas p on p.id = e.proposta_id
    where p.caminho = ${CAMINHO} and e.tipo = 'aceite' order by e.criado_em desc limit 1`;
  checar(ultimo?.detalhe?.opcaoNome === "Plano completo", "guarda a opção escolhida");
  checar(ultimo?.detalhe?.valorCentavos === 1250000, "guarda o valor em centavos");
  checar(
    ultimo?.ip === "189.45.12.7",
    "guarda o IP do cliente (primeiro do x-forwarded-for)",
    `guardou "${ultimo?.ip}", esperava o primeiro endereço e não a cadeia inteira`,
  );
  checar(Boolean(ultimo?.user_agent), "guarda o navegador");
} finally {
  await limpar();
  await sql.end();
}

console.log(falhas === 0 ? "\n✓ tudo passou\n" : `\n✗ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
