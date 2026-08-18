import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Checagem OTIMISTA do painel. No Next 16 o antigo middleware se chama proxy.
 *
 * Só olha se o cookie de sessão existe, para mandar quem não tem para a tela de
 * entrada sem renderizar nada. Ele NÃO verifica a assinatura e NÃO é a
 * autorização: isso é `exigirAdmin()`, em `src/lib/admin/guarda.ts`, chamado
 * dentro de cada página e cada action. Cookie forjado passa por aqui e morre lá.
 *
 * O matcher deixa `/admin/entrar` de fora, senão quem não está logado ficaria
 * preso num redirecionamento para a própria tela de entrada.
 */
export function proxy(request: NextRequest) {
  const temCookie = request.cookies.has("sessao_admin");
  if (temCookie) return NextResponse.next();

  const destino = new URL("/admin/entrar", request.url);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/admin", "/admin/((?!entrar).*)"],
};
