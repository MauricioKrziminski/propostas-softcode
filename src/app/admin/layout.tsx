import type { Metadata } from "next";

import "@/styles/mesa.css";

/**
 * A casca do painel.
 *
 * O admin é ferramenta, não peça de venda, e o desenho segue essa função: cabine
 * escura, densa, sem vidro e sem parallax. A ousadia visual do projeto pertence
 * à proposta que o cliente lê; aqui o que importa é achar o campo, digitar e
 * salvar, muitas vezes no celular entre uma reunião e outra.
 *
 * A escuridão também tem razão prática: a prévia da proposta aparece dentro
 * desta tela, e um documento claro sobre uma cabine escura se lê como documento,
 * não como mais um painel.
 */
export const metadata: Metadata = {
  title: "Mesa de propostas",
  robots: { index: false, follow: false, nocache: true },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesa relative min-h-[100dvh] font-texto antialiased">
      <div
        aria-hidden
        className="grade-mesa pointer-events-none fixed inset-0"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
