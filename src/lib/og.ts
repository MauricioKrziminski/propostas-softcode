import fs from "node:fs";
import path from "node:path";

/**
 * O material das imagens de compartilhamento.
 *
 * `ImageResponse` não enxerga o CSS da página nem o `next/font`: ele monta a
 * imagem num renderizador próprio, e precisa receber a fonte como bytes e a
 * marca como dado embutido. Por isso os arquivos são LIDOS do disco aqui, uma
 * vez, no módulo.
 *
 * As fontes são as mesmas do PDF, e não por economia: usar a Fraunces no card do
 * WhatsApp é o que faz o link chegar parecido com a proposta que ele abre. Antes
 * o card saía na fonte padrão do renderizador, e parecia de outro produto.
 */
const raizFontes = path.join(process.cwd(), "src", "lib", "pdf", "fontes");

export const FONTES_OG = [
  {
    name: "Fraunces",
    data: fs.readFileSync(path.join(raizFontes, "Fraunces-Bold.ttf")),
    weight: 700 as const,
    style: "normal" as const,
  },
];

/**
 * Uma fonte só, e o motivo é técnico: a Satoshi do projeto é VARIÁVEL (tem
 * tabela `fvar`), e o renderizador do card não suporta fonte variável. Passar
 * ela derrubava a rota inteira, com "failed to pipe response" no log e link
 * chegando sem imagem nenhuma. A Fraunces é estática, então é ela que fica, e o
 * card inteiro sai na serifada da marca.
 */

/**
 * O símbolo da marca em base64.
 *
 * `<img src="/Logos/...">` não funciona aqui: o renderizador não tem servidor
 * para buscar caminho relativo, e uma URL absoluta dependeria do domínio estar
 * no ar no momento em que a imagem é gerada. Embutido, sempre funciona.
 */
export const SIMBOLO_OG = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), "src", "app", "icon.png"))
  .toString("base64")}`;

/** A paleta noite da proposta, que é o registro visual dos cards. */
export const COR_OG = {
  fundo: "#0a1420",
  elevado: "#132131",
  linha: "#24374d",
  texto: "#e8eef6",
  neblina: "#8fa3bb",
  acento: "#5b8dff",
} as const;

export const TAMANHO_OG = { width: 1200, height: 630 };
