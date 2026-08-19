import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Três faces, cada uma com um papel que as outras não fazem.
 *
 * FRAUNCES é a escolha de display por causa de dois eixos raros: `WONK`
 * (irregularidade) e `SOFT` (arredondamento). Em `WONK 0` ela é uma serifada
 * séria; em `WONK 1` fica editorial e torta. A hierarquia inteira sai de um
 * arquivo só, e a dose de ousadia é um número, não uma troca de fonte.
 * `axes` é obrigatório: sem declarar, o arquivo vem só com `wght`.
 *
 * SATOSHI é auto-hospedada porque não existe no Google Fonts (Fontshare,
 * licença ITF FFL, uso comercial e self-host liberados). É a grotesca de
 * agência premiada; não parece fonte padrão de dev tool.
 *
 * GEIST MONO carrega só os números: preço em fonte proporcional dança de
 * largura entre as opções e é o detalhe que mais denuncia amadorismo.
 */
const display = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
  variable: "--fonte-display",
});

const texto = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--fonte-texto",
  preload: true,
});

const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--fonte-mono",
});

/**
 * `metadataBase` resolve os endereços relativos das imagens de compartilhamento.
 *
 * Sem ela, o card do WhatsApp aponta para um caminho relativo e o aplicativo não
 * consegue buscar a imagem: o link chega sem foto, que é justamente o que o
 * `opengraph-image` existe para evitar.
 *
 * A função existe em vez de um `??` porque variável de ambiente VAZIA não é
 * variável ausente: `??` deixa a string vazia passar, e `new URL("")` derruba o
 * build inteiro na coleta de dados das páginas. Foi assim que o primeiro deploy
 * quebrou. Aqui, vazio, só espaço ou valor inválido caem no padrão.
 */
function enderecoBase(): string {
  const candidatos = [
    process.env.NEXT_PUBLIC_URL_BASE,
    /* Domínio estável do projeto, quando existe; `VERCEL_URL` muda a cada
       deploy e serve só como último recurso em pré-visualização. */
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    "http://localhost:3000",
  ];

  for (const bruto of candidatos) {
    const valor = bruto?.trim().replace(/\/+$/, "");
    if (!valor) continue;
    try {
      return new URL(valor).toString();
    } catch {
      console.warn(`[metadataBase] endereço inválido, ignorado: ${valor}`);
    }
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(enderecoBase()),
  title: "SoftCode",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${texto.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
