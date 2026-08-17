import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

/**
 * Uma família, um arquivo, dois pesos.
 * O eixo `wdth` vem junto para o display largo (125) conviver com o texto (100)
 * sem baixar um segundo arquivo — e sem nunca ser animado.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--fonte-archivo",
});

export const metadata: Metadata = {
  title: "SoftCode",
  // Cinto e suspensório junto com o header X-Robots-Tag do next.config.ts.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0c231d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
