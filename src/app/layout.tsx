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

export const metadata: Metadata = {
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
