/**
 * Formatação pt-BR. Tudo aqui roda no servidor e no cliente com o mesmo
 * resultado — datas são tratadas como data civil (sem fuso), justamente para
 * não renderizar "16/09" no servidor e "15/09" no navegador do cliente.
 */

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MOEDA_COM_CENTAVOS = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Centavos → "R$ 48.000". Mostra centavos só quando existirem de fato. */
export function formatarValor(centavos: number): string {
  const reais = centavos / 100;
  return Number.isInteger(reais) ? MOEDA.format(reais) : MOEDA_COM_CENTAVOS.format(reais);
}

/**
 * "2026-08-17" → Date em UTC ao meio-dia.
 * O meio-dia evita que qualquer fuso negativo jogue a data para o dia anterior.
 */
function dataCivil(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, 12));
}

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-08-17" → "17 de agosto de 2026" */
export function formatarDataLonga(iso: string): string {
  return DATA_LONGA.format(dataCivil(iso));
}

/** "2026-08-17" → "17/08/2026" */
export function formatarDataCurta(iso: string): string {
  return DATA_CURTA.format(dataCivil(iso));
}

/** Data civil de hoje, em AAAA-MM-DD, no fuso de São Paulo. */
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

/**
 * Proposta vencida = validade estritamente anterior a hoje.
 * O dia da validade ainda vale — vencer no meio do dia seria hostil.
 */
export function estaExpirada(validaAte: string, hoje = hojeISO()): boolean {
  return validaAte < hoje;
}

/** Dias restantes de validade. Negativo quando já venceu. */
export function diasRestantes(validaAte: string, hoje = hojeISO()): number {
  const ms = dataCivil(validaAte).getTime() - dataCivil(hoje).getTime();
  return Math.round(ms / 86_400_000);
}

/** Texto de validade para o hero e para o selo. */
export function textoValidade(validaAte: string, hoje = hojeISO()): string {
  const dias = diasRestantes(validaAte, hoje);
  if (dias < 0) return "Validade encerrada";
  if (dias === 0) return "Válida até hoje";
  if (dias === 1) return "Válida até amanhã";
  return `Válida por mais ${dias} dias`;
}
