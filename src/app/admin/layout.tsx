import type { Metadata } from "next";

/**
 * Casca do painel.
 *
 * O admin é ferramenta interna, e o desenho segue essa função: claro, sóbrio,
 * sem vidro, sem parallax, sem reveal. Toda a ousadia visual do projeto pertence
 * à proposta que o cliente lê; aqui o que importa é achar o campo, digitar e
 * salvar, de preferência no celular entre uma reunião e outra. Por isso alvos de
 * 44px e uma coluna só.
 */
export const metadata: Metadata = {
  title: "Painel de propostas",
  robots: { index: false, follow: false, nocache: true },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-elevado font-texto text-texto">{children}</div>
  );
}
