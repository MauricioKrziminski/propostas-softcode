/**
 * Tokens do PDF — espelham `globals.css`, mas vivem aqui de propósito.
 *
 * O `@react-pdf/renderer` não enxerga o CSS da página: ele tem o próprio motor
 * de layout (flexbox, sem grid, sem pseudo-elemento, sem variável CSS). Mudar a
 * paleta na tela exige mudar aqui — foi assim que o card do WhatsApp já ficou
 * uma fase inteira em verde enquanto a página era azul.
 */
export const COR = {
  fundo: "#ffffff",
  azulClaro: "#f0f6ff",
  navy: "#0d1b2a",
  noite: "#0a1420",
  texto: "#1e293b",
  neblina: "#64748b",
  acento: "#2563eb",
  acentoClaro: "#5b8dff",
  linha: "#e2e8f0",
  linhaAzul: "#c7d9f5",
} as const;

export const FONTE = {
  display: "Fraunces",
  texto: "Satoshi",
} as const;
