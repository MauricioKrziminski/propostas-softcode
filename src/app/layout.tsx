import type { Metadata, Viewport } from "next";
import { Playfair_Display, Geist } from "next/font/google";
import "./globals.css";

/**
 * A tipografia da marca, tirada do softcodedev.com.br:
 * Playfair Display 700 nos títulos, Geist 400 no corpo.
 * Duas faces, dois pesos — o limite do projeto.
 */
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--fonte-display",
});

const texto = Geist({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--fonte-texto",
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
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
